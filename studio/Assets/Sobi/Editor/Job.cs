using System;

namespace Sobi.Studio
{
    // Render jobs are compiled by scripts/studio (TypeScript) from recipes + style.json.
    // Unity only renders them: no recipe logic lives on this side.
    [Serializable]
    public class JobFile
    {
        public int version;
        public string outDir;
        public Job[] jobs;
    }

    [Serializable]
    public class Job
    {
        public string id;
        public string output;      // path relative to outDir
        public int width;          // one frame, final pixels
        public int height;
        public int supersample;
        public string mode;        // "sdf" (3D toon) or "flat" (2D bands)
        public float[] camCenter;
        public float[] camRight;
        public float[] camUp;
        public float[] camFwd;
        public float halfW;
        public float halfH;
        public float far;
        public float eps;
        public int cols;           // sheet columns; frames fill left to right, top to bottom
        public JobStyle style;
        public Frame[] frames;
    }

    [Serializable]
    public class JobStyle
    {
        public float[] lightDir;
        public float[] lightColor;
        public float[] shadowTint;
        public float[] aoTint;
        public float[] bands;
        public float[] rim;
        public float[] ao;
        public float[] lines;      // outer px, inner px (supersampled), depth jump, group depth gap
        public float[] paint;      // grain amount, grain frequency, light gradient, unused
    }

    [Serializable]
    public class Frame
    {
        // Packed GPU structs: 36 floats + 4 ints per prim, 24 floats + 4 ints per paint
        // (see SdfRender.compute and scripts/studio/compile.ts).
        public float[] prims;
        public int[] primInfo;
        public float[] paints;
        public int[] paintInfo;
    }
}
