using System;
using UnityEditor;
using UnityEngine;

namespace Sobi.Studio
{
    // Batch-mode entry point:
    //   Unity.exe -batchmode -quit -projectPath studio -executeMethod Sobi.Studio.Cli.Run -logFile - -- render <jobs.json>
    // scripts/studio/run.ts wraps this; nothing here is shipped with the game.
    public static class Cli
    {
        public static void Run()
        {
            int code = 0;
            try
            {
                var all = Environment.GetCommandLineArgs();
                int sep = Array.IndexOf(all, "--");
                if (sep < 0 || sep + 1 >= all.Length) throw new Exception("usage: -- render <jobs.json>");
                string cmd = all[sep + 1];
                switch (cmd)
                {
                    case "render":
                        if (sep + 2 >= all.Length) throw new Exception("render needs a job file");
                        int n = Renderer.RenderFile(all[sep + 2]);
                        Debug.Log($"[studio] done: {n} job(s)");
                        break;
                    case "info":
                        Debug.Log($"[studio] unity {Application.unityVersion}, gpu {SystemInfo.graphicsDeviceName} ({SystemInfo.graphicsDeviceType}), compute {SystemInfo.supportsComputeShaders}");
                        break;
                    default:
                        throw new Exception("unknown command: " + cmd);
                }
            }
            catch (Exception e)
            {
                Debug.LogError("[studio] FAILED: " + e);
                code = 1;
            }
            EditorApplication.Exit(code);
        }
    }
}
