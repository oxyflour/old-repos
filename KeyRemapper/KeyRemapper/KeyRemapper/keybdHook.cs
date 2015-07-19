using System;
using System.Collections.Generic;
using System.Text;
using System.Runtime.InteropServices;
using System.IO;
using System.Text.RegularExpressions;

namespace KeyRemapper
{
    public enum SetMode
    {
        Reset,
        SetCurrent,
        Shield,
        NoSet
    }
    class keybdHook
    {
        public struct KBDLLHOOKSTRUCT
        {
            public UInt32 wVk;
            public UInt32 wScan;
            public UInt32 dwFlags;
            public UInt32 time;
            public UInt32 dwExtraInfo;
        }
        public struct KEYBDINPUT
        {
            public UInt16 wVK;
            public UInt16 wScan;
            public UInt32 dwFlags;
            public UInt32 time;
            public UInt32 dwExtraInfo;
        }
        private const int WH_KEYBOARD_LL = 13;
        private delegate bool HookProc(int nCode, int wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hInst, int dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall, SetLastError = true)]
        private static extern int UnhookWindowsHookEx(IntPtr hHook);

        [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall, SetLastError = true)]
        private static extern bool CallNextHookEx(IntPtr idHook, int nCode, int wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall, SetLastError = true)]
        private static extern void keybd_event(Byte bVK, Byte bScan, UInt32 dwFlags, UInt32 dwExtraInfo);

        //字段
        public KEYBDINPUT CurKey;
        private KEYBDINPUT[] KeyMap;
        private IntPtr hHook;
        private HookProc Proc;

        //构造器
        public keybdHook()
        {
            KeyMap = new KEYBDINPUT[256];
            hHook = IntPtr.Zero;
            Proc = new HookProc(keybdHookProc);
        }
        ~keybdHook()
        {
            if (hHook != IntPtr.Zero)
                UnhookWindowsHookEx(hHook);
        }

        //方法
        public bool StartHook()
        {
            if (hHook == IntPtr.Zero)
                hHook = SetWindowsHookEx(WH_KEYBOARD_LL, Proc, IntPtr.Zero, 0);
            return hHook != IntPtr.Zero;
        }
        public bool StopHook()
        {
            if (hHook != IntPtr.Zero)
            {
                UnhookWindowsHookEx(hHook);
                hHook = IntPtr.Zero;
                return true;
            }
            return false;
        }
        //回调函数
        private bool keybdHookProc(int nCode, int wParam, IntPtr lParam)
        {
            if (nCode == 0)
            {
                KBDLLHOOKSTRUCT hs = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                if ((hs.dwFlags & 0x10) == 0)
                {
                    UInt32 keysta = ((hs.dwFlags & 0x80) != 0) ? 0x0002u : 0;
                    CurKey.wVK = (UInt16)hs.wVk;
                    CurKey.wScan = (UInt16)hs.wScan;
                    CurKey.dwFlags = hs.dwFlags;
                    if (KeyMap[hs.wVk].wVK != 0)
                    {
                        if (KeyMap[hs.wVk].wVK != 255)
                            keybd_event((Byte)KeyMap[hs.wVk].wVK, (Byte)KeyMap[hs.wVk].wScan, KeyMap[hs.wVk].dwFlags | keysta, KeyMap[hs.wVk].dwExtraInfo);
                        return true;
                    }
                }
            }
            return CallNextHookEx(hHook, nCode, wParam, lParam);
        }
        //方法
        public SetMode Load(string strFile)
        {
            if (File.Exists(strFile))
            {
                for (int i = 0; i < 256; i++)
                    KeyMap[i].wVK = 0;
                StreamReader sr = new StreamReader(strFile);
                string st = sr.ReadLine();
                if (st == "Type: KeyMap File")
                    foreach (Match m in Regex.Matches(sr.ReadToEnd(), "Key ([0-9]+): wVK:([0-9]+); wScan:([0-9]+); dwFlags:([0-9]+)"))
                    {
                        int key = int.Parse(m.Groups[1].Value);
                        if (key > 0 && key < 255)
                        {
                            KeyMap[key].wVK = (UInt16)int.Parse(m.Groups[2].Value);
                            KeyMap[key].wScan = (UInt16)int.Parse(m.Groups[3].Value);
                            KeyMap[key].dwFlags = (UInt32)int.Parse(m.Groups[4].Value);
                        }
                    }
                sr.Close();
                return SetMode.NoSet;
            }
            return SetMode.Reset;
        }
        public int Save(string strFile)
        {
            StreamWriter sw = new StreamWriter(strFile);
            sw.WriteLine("Type: KeyMap File");
            sw.WriteLine("//Depend on Hardware, May not Work on another Computer");
            for (int i = 0; i < 256; i++)
            {
                if (KeyMap[i].wVK != 0)
                {
                    string str = "Key " + i.ToString();
                    str += ": wVK:" + KeyMap[i].wVK.ToString();
                    str += "; wScan:" + KeyMap[i].wScan.ToString();
                    str += "; dwFlags:" + KeyMap[i].dwFlags.ToString();
                    sw.WriteLine(str);
                }
            }
            sw.Close();
            return 0;
        }
        public int SetKeyMap(int vkCurKey, SetMode sm)
        {
            if (vkCurKey <= 0 || vkCurKey >= 256)
                return 0;
            if (sm == SetMode.NoSet)
            {
                int ret = KeyMap[vkCurKey].wVK;
                return ret == 0 ? vkCurKey : ret;
            }
            else if (sm == SetMode.Reset)
            {
                KeyMap[vkCurKey].wVK = 0;
                return vkCurKey;
            }
            else if (sm == SetMode.Shield)
            {
                KeyMap[vkCurKey].wVK = 255;
                return 255;
            }
            else if (sm == SetMode.SetCurrent)
            {
                KeyMap[vkCurKey] = CurKey;
                if (vkCurKey == CurKey.wVK) KeyMap[vkCurKey].wVK = 0;
                return CurKey.wVK;
            }
            return 0;
        }
    }
}
