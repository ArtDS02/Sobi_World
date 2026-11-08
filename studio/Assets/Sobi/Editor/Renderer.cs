using System;
using System.IO;
using Unity.Collections;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace Sobi.Studio
{
    public static class Renderer
    {
        const int PrimFloats = 36;   // + 4 ints
        const int PaintFloats = 24;  // + 4 ints
        const int Tile = 256;
        const string ShaderPath = "Assets/Sobi/Shaders/SdfRender.compute";

        public static int RenderFile(string jobPath)
        {
            var file = JsonUtility.FromJson<JobFile>(File.ReadAllText(jobPath));
            if (file == null || file.jobs == null) throw new Exception("job file is empty: " + jobPath);
            var cs = AssetDatabase.LoadAssetAtPath<ComputeShader>(ShaderPath);
            if (cs == null) throw new Exception("compute shader missing: " + ShaderPath);
            int done = 0;
            foreach (var job in file.jobs)
            {
                var started = DateTime.Now;
                var png = RenderJob(cs, job);
                var outPath = Path.Combine(file.outDir, job.output);
                Directory.CreateDirectory(Path.GetDirectoryName(outPath));
                File.WriteAllBytes(outPath, png);
                done++;
                Debug.Log($"[studio] rendered {job.id} -> {job.output} ({(DateTime.Now - started).TotalSeconds:F1}s)");
            }
            return done;
        }

        static float[] Pack(float[] floats, int[] info, int nf, out int count)
        {
            count = info == null ? 0 : info.Length / 4;
            int stride = nf + 4;
            var data = new float[Math.Max(1, count) * stride];
            for (int i = 0; i < count; i++)
            {
                Array.Copy(floats, i * nf, data, i * stride, nf);
                for (int k = 0; k < 4; k++) data[i * stride + nf + k] = BitConverter.Int32BitsToSingle(info[i * 4 + k]);
            }
            return data;
        }

        static Vector3 V3(float[] a) => new Vector3(a[0], a[1], a[2]);
        static Vector4 V4(float[] a) => new Vector4(a[0], a[1], a[2], a[3]);

        static RenderTexture MakeRT(int w, int h)
        {
            var rt = new RenderTexture(w, h, 0, RenderTextureFormat.ARGBFloat, RenderTextureReadWrite.Linear)
            {
                enableRandomWrite = true,
                filterMode = FilterMode.Point
            };
            rt.Create();
            return rt;
        }

        public static byte[] RenderJob(ComputeShader cs, Job job)
        {
            int ss = Math.Max(1, job.supersample);
            int w = job.width, h = job.height;
            int sw = w * ss, sh = h * ss;
            int frames = job.frames.Length;
            int cols = Math.Max(1, job.cols);
            int rows = (frames + cols - 1) / cols;
            var sheet = new Texture2D(w * cols, h * rows, TextureFormat.RGBA32, false, true);
            var clear = new Color32[sheet.width * sheet.height];
            sheet.SetPixels32(clear);

            int kG = cs.FindKernel("GBuffer"), kS = cs.FindKernel("Shade"), kF = cs.FindKernel("Flat"), kD = cs.FindKernel("Down");
            foreach (var k in new[] { kG, kS, kF, kD })
                if (!cs.IsSupported(k)) throw new Exception("compute kernel " + k + " is invalid (shader compile error, see log)");
            var g0 = MakeRT(sw, sh); var g1 = MakeRT(sw, sh); var g2 = MakeRT(sw, sh); var g3 = MakeRT(sw, sh);
            var color = MakeRT(sw, sh); var output = MakeRT(w, h);

            cs.SetVector("_CamCenter", V3(job.camCenter));
            cs.SetVector("_CamRight", V3(job.camRight));
            cs.SetVector("_CamUp", V3(job.camUp));
            cs.SetVector("_CamFwd", V3(job.camFwd));
            cs.SetVector("_Half", new Vector2(job.halfW, job.halfH));
            cs.SetInts("_Size", sw, sh);
            cs.SetFloat("_Far", job.far);
            cs.SetFloat("_Eps", job.eps);
            cs.SetInt("_SS", ss);
            var st = job.style;
            cs.SetVector("_LightDir", V3(st.lightDir));
            cs.SetVector("_LightColor", V3(st.lightColor));
            cs.SetVector("_ShadowTint", V3(st.shadowTint));
            cs.SetVector("_AoTint", V3(st.aoTint));
            cs.SetVector("_Bands", V4(st.bands));
            cs.SetVector("_Rim", V4(st.rim));
            cs.SetVector("_Ao", V4(st.ao));
            cs.SetVector("_Lines", V4(st.lines));
            cs.SetVector("_Paint", V4(st.paint));

            bool flat = job.mode == "flat";
            var src = LoadSource(job.source);
            cs.SetTexture(kF, "_Src", src);
            for (int f = 0; f < frames; f++)
            {
                var fr = job.frames[f];
                var primData = Pack(fr.prims, fr.primInfo, PrimFloats, out int primCount);
                var paintData = Pack(fr.paints, fr.paintInfo, PaintFloats, out int paintCount);
                using var primBuf = new ComputeBuffer(Math.Max(1, primCount), (PrimFloats + 4) * 4);
                using var paintBuf = new ComputeBuffer(Math.Max(1, paintCount), (PaintFloats + 4) * 4);
                primBuf.SetData(primData);
                paintBuf.SetData(paintData);
                cs.SetInt("_PrimCount", primCount);
                cs.SetInt("_PaintCount", paintCount);
                foreach (var k in new[] { kG, kS, kF })
                {
                    cs.SetBuffer(k, "_Prims", primBuf);
                    cs.SetBuffer(k, "_Paints", paintBuf);
                }

                if (flat)
                {
                    cs.SetTexture(kF, "_Color", color);
                    cs.Dispatch(kF, (sw + 7) / 8, (sh + 7) / 8, 1);
                }
                else
                {
                    cs.SetTexture(kG, "_G0", g0); cs.SetTexture(kG, "_G1", g1);
                    cs.SetTexture(kG, "_G2", g2); cs.SetTexture(kG, "_G3", g3);
                    for (int ty = 0; ty < sh; ty += Tile)
                        for (int tx = 0; tx < sw; tx += Tile)
                        {
                            cs.SetInts("_Offset", tx, ty);
                            cs.Dispatch(kG, Tile / 8, Tile / 8, 1);
                            GL.Flush();
                        }
                    cs.SetTexture(kS, "_G0", g0); cs.SetTexture(kS, "_G1", g1);
                    cs.SetTexture(kS, "_G2", g2); cs.SetTexture(kS, "_G3", g3);
                    cs.SetTexture(kS, "_Color", color);
                    cs.Dispatch(kS, (sw + 7) / 8, (sh + 7) / 8, 1);
                }
                cs.SetTexture(kD, "_Color", color);
                cs.SetTexture(kD, "_Out", output);
                cs.Dispatch(kD, (w + 7) / 8, (h + 7) / 8, 1);

                var req = AsyncGPUReadback.Request(output, 0, TextureFormat.RGBAFloat);
                req.WaitForCompletion();
                if (req.hasError) throw new Exception("GPU readback failed for " + job.id);
                NativeArray<float> px = req.GetData<float>();
                int ox = (f % cols) * w, oyTop = (f / cols) * h;
                var pixels = new Color32[w * h];
                for (int y = 0; y < h; y++)
                    for (int x = 0; x < w; x++)
                    {
                        int i = (y * w + x) * 4;
                        float a = px[i + 3];
                        // premultiplied linear -> straight sRGB
                        float r = a > 1e-6f ? px[i] / a : 0, g = a > 1e-6f ? px[i + 1] / a : 0, b = a > 1e-6f ? px[i + 2] / a : 0;
                        byte A = (byte)Mathf.Clamp(Mathf.RoundToInt(a * 255f), 0, 255);
                        var c = A == 0 ? new Color32(0, 0, 0, 0) : new Color32(Srgb(r), Srgb(g), Srgb(b), A);
                        pixels[(h - 1 - y) * w + x] = c; // texture row 0 is the bottom row
                    }
                sheet.SetPixels32(ox, sheet.height - oyTop - h, w, h, pixels);
            }
            sheet.Apply(false);
            var bytes = sheet.EncodeToPNG();
            UnityEngine.Object.DestroyImmediate(sheet);
            foreach (var rt in new[] { g0, g1, g2, g3, color, output }) rt.Release();
            UnityEngine.Object.DestroyImmediate(src);
            return bytes;
        }

        // Source art for image layers as linear, premultiplied floats (correct filtering at the edges).
        static Texture2D LoadSource(string path)
        {
            if (string.IsNullOrEmpty(path))
            {
                var empty = new Texture2D(1, 1, TextureFormat.RGBAFloat, false, true);
                empty.SetPixel(0, 0, new Color(0, 0, 0, 0));
                empty.Apply();
                return empty;
            }
            var png = new Texture2D(2, 2, TextureFormat.RGBA32, false, true);
            if (!png.LoadImage(File.ReadAllBytes(path))) throw new Exception("cannot read source art " + path);
            var px = png.GetPixels32();
            var lin = new Color[px.Length];
            for (int i = 0; i < px.Length; i++)
            {
                float a = px[i].a / 255f;
                lin[i] = new Color(Lin(px[i].r) * a, Lin(px[i].g) * a, Lin(px[i].b) * a, a);
            }
            var tex = new Texture2D(png.width, png.height, TextureFormat.RGBAFloat, false, true)
            {
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp
            };
            tex.SetPixels(lin);
            tex.Apply(false);
            UnityEngine.Object.DestroyImmediate(png);
            return tex;
        }

        static float Lin(byte v)
        {
            float s = v / 255f;
            return s <= 0.04045f ? s / 12.92f : Mathf.Pow((s + 0.055f) / 1.055f, 2.4f);
        }

        static byte Srgb(float v)
        {
            v = Mathf.Clamp01(v);
            float s = v <= 0.0031308f ? v * 12.92f : 1.055f * Mathf.Pow(v, 1f / 2.4f) - 0.055f;
            return (byte)Mathf.Clamp(Mathf.RoundToInt(s * 255f), 0, 255);
        }
    }
}
