using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace GadgetHelper{
	[ComVisible(true)]
	[Guid("47C976E0-C208-4740-AC42-41212D3C34F0")]
	[InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
	public interface IWndMgrEvent {
		[DispId(0)]
		void GroupChanged(int index);
	}
	[ComVisible(true)]
	[Guid("BACC9D9B-9B1C-47df-8281-419DDA01B0B8")]
	[InterfaceType(ComInterfaceType.InterfaceIsDual)]
	public interface IWndMgr {
		[DispId(9)]
		int getCurrentWindow();
		[DispId(10)]
		int getCurrentGroup();
		[DispId(11)]
		int getTotalGroups();
		[DispId(12)]
		String getGroupJSON(int index);
		[DispId(18)]
		int setCurrentWindow(int wnd);
		[DispId(13)]
		int setCurrentGroup(int index, String ignList);
		[DispId(14)]
		int setNextGroup(String ignList);
		[DispId(15)]
		int setPrevGroup(String ignList);
		[DispId(16)]
		int setWindowToGroup(int from, int to, String list, bool move);
		[DispId(17)]
		int executeMoveToGroup(String file, String directory, int index, bool move);
	}
	[ComVisible(true)]
	[Guid("20E07A39-4495-4ad8-A2F7-B01378EDBCE7")]
	[ClassInterface(ClassInterfaceType.None)]
	[ComSourceInterfaces(typeof(IWndMgrEvent))]
	public class WindowManager:IWndMgr {
		public WindowManager() {}
		~WindowManager() {}
		
		//////////////////////////////////////////////////////////
		// interface
		//////////////////////////////////////////////////////////
		public int getCurrentWindow() {
			return GetForegroundWindow().ToInt32();
		}
		public int getCurrentGroup() {
			RegistryKey rk = getRegKey();
			return (int)rk.GetValue("index", -1);
		}
		public int getTotalGroups() {
			RegistryKey rk = getRegKey();
			return (int)rk.GetValue("maxIndex", -1);
		}
		public String getGroupJSON(int index) {
			int[] wndList = (getGroupWndSaveData(index)).l;
			List<WndInfo> wndListInfo = new List<WndInfo>();
			for (int i = 0; i < wndList.Length; i ++) {
				IntPtr hwnd = new IntPtr(wndList[i]);
				StringBuilder title = new StringBuilder(1024);
				GetWindowText(hwnd, title, title.Capacity);
				StringBuilder cls = new StringBuilder(1024);
				GetClassName(hwnd, cls, cls.Capacity);
				wndListInfo.Add(new WndInfo(wndList[i], title.ToString(), cls.ToString()));
			}
			return (new JavaScriptSerializer()).Serialize(wndListInfo.ToArray());
		}
		
		public int setCurrentWindow(int wnd) {
			IntPtr hwnd = new IntPtr(wnd);
			if (IsWindow(hwnd))
				SetForegroundWindow(hwnd);
			return wnd;
		}
		public int setWindowToGroup(int from, int to, String list, bool move) {
			RegistryKey rk = getRegKey();
			verifyRegConfig(rk);
			int current = (int)rk.GetValue("index", 0);
			int max = (int)rk.GetValue("maxIndex");
			if (from < 0) from = current;
			if (to < 0) to = current;
			if (from == to || from >= max || to >= max) return current;
			
			List<int> wndMove = parseWndListMove(list);
			WndSaveData wsdFrom = getGroupWndSaveData(from), wsdTo = getGroupWndSaveData(to);
			updateWndListMove(ref wsdFrom, ref wsdTo, wndMove);
			rk.SetValue(from.ToString(), (new JavaScriptSerializer()).Serialize(wsdFrom));
			rk.SetValue(to.ToString(), (new JavaScriptSerializer()).Serialize(wsdTo));
			
			if (move) {
				if (current == to)
					restoreWndList(new WndSaveData(wndMove.ToArray(), 0));
				else {
					if (current == from)
						hideWndList(wsdFrom);
					else
						hideWndList(getGroupWndSaveData(current));
					if (wndMove.Count > 0)
						wsdTo.a = wndMove[0];
					restoreWndList(wsdTo);
					
					rk.SetValue("index", to);
					fireThreadNotify(to);
				}
			}
			else {
				if (current == to)
					restoreWndList(new WndSaveData(wndMove.ToArray(), 0));
				else if (current == from)
					hideWndList(new WndSaveData(wndMove.ToArray(), 0));
			}
			return (int)rk.GetValue("index", -1);
		}
		public int setCurrentGroup(int index, String ignList) {
			return setWindowToGroup(-1, index, ignList, true);
		}
		public int setNextGroup(String ignList) {
			int oldIndex = getCurrentGroup();
			if (oldIndex + 1 < getTotalGroups())
				return setWindowToGroup(-1, oldIndex + 1, ignList, true);
			return setWindowToGroup(-1, 0, ignList, true);
		}
		public int setPrevGroup(String ignList) {
			int oldIndex = getCurrentGroup();
			if (oldIndex - 1 >= 0)
				return setWindowToGroup(-1, oldIndex - 1, ignList, true);
			return setWindowToGroup(-1, getTotalGroups() - 1, ignList, true);
		}
		
		public int executeMoveToGroup(String file, String directory, int index, bool move) {
			RegistryKey rk = getRegKey();
			verifyRegConfig(rk);
			int current = (int)rk.GetValue("index", 0);
			int max = (int)rk.GetValue("maxIndex");
			if (index < 0 || index >= max) index = current;
			
			ProcessStartInfo si = new ProcessStartInfo();
			si.FileName = file;
			si.WorkingDirectory = directory;
			si.WindowStyle = (move || index == current) ? ProcessWindowStyle.Normal : ProcessWindowStyle.Hidden;
			Process proc = Process.Start(si);
			if (proc == null) return 0;
			
			int wndCount = 0;
			WndFinder wf = new WndFinder(new List<int>(), proc.Id);
			for (int i = 0; i < 20; i ++) {
				Thread.Sleep(200);
				wf.wndList.Clear();
				object wfRef = wf;
				EnumDesktopWindows(IntPtr.Zero, new EnumCallback(FindExecWindow), ref wfRef);
				if (proc.HasExited) break;
				if (wf.wndList.Count > 0 && wf.wndList.Count == wndCount) break;
				wndCount = wf.wndList.Count;
			}
			
			if (current != index && wndCount > 0) {
				String list = "";
				foreach (int wnd in wf.wndList) {
					if (list == "") list = wnd.ToString();
					else list = list + "," + wnd.ToString();
				}
				setWindowToGroup(-1, index, list, move);
			}
			
			return wndCount;
		}
		
		//////////////////////////////////////////////////////////
		// events notify
		//////////////////////////////////////////////////////////
		public delegate void GroupChangeHandle(int index);
		public event GroupChangeHandle GroupChanged {
			add {GroupChangeEvent += value; attachGroupChange();}
			remove {GroupChangeEvent -= value; dettachGroupChange();}
		}

		//////////////////////////////////////////////////////////
		// win32 api invokes
		//////////////////////////////////////////////////////////
		public class WndSaveData {
			public WndSaveData() {}
			public WndSaveData(int[] wndList, int wndActive) {
				this.l = wndList;
				this.a = wndActive;
			}
			public int[] l;
			public int a;
		}
		public class WndInfo {
			public WndInfo() {}
			public WndInfo(int id, String title, String cls) {
				this.i = id;
				this.t = title;
				this.c = cls;
			}
			public int i;
			public String t;
			public String c;
		}
		public class WndFinder {
			public WndFinder(List<int> wndList, int proc) {
				this.wndList = wndList;
				this.proc = proc;
			}
			public List<int> wndList;
			public int proc;
		}
		public class WndFilter {
			public List<int> wndList;
			public List<int> ignProcess;
			public List<String> ignClass;
		}
		
		public delegate bool EnumCallback(IntPtr hwnd, ref object param);
		public static bool FindExecWindow(IntPtr hwnd, ref object param) {
			WndFinder wf = (WndFinder)param;
			//add to the list
			int proc = 0;
			GetWindowThreadProcessId(hwnd, out proc);
			if (wf.proc == proc)
				wf.wndList.Add(hwnd.ToInt32());
			return true;
		}
		public static bool FindHideWindow(IntPtr hwnd, ref object param) {
			WndFilter wf = (WndFilter)param;
			//no hidden windows
			if (!IsWindowVisible(hwnd)) return true;
			//no windows with the speciefic process
			int proc = 0;
			GetWindowThreadProcessId(hwnd, out proc);
			if (wf.ignProcess.Contains(proc)) return true;
			//no windows of the speciefic class
			StringBuilder cls = new StringBuilder(1024);
			GetClassName(hwnd, cls, cls.Capacity);
			if (wf.ignClass.Contains(cls.ToString())) return true;
			//add to the list
			wf.wndList.Insert(0, hwnd.ToInt32());
			return true;
		}
		
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern int EnumDesktopWindows(IntPtr hdesktop, EnumCallback cb, ref object param);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		private extern static IntPtr FindWindow(String lpClassName, String lpWindowName);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern int GetWindowThreadProcessId(IntPtr hwnd, out int ID);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool IsWindow(IntPtr hwnd);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool IsWindowVisible(IntPtr hwnd);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool ShowWindowAsync(IntPtr hwnd, int cmdshow);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool ShowWindow(IntPtr hwnd, int cmdshow);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern IntPtr GetParent(IntPtr hwnd);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern IntPtr GetForegroundWindow();
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool BringWindowToTop(IntPtr hwnd);
		[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		public static extern bool SetForegroundWindow(IntPtr hwnd);
		
		[DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
		private static extern int GetCurrentThreadId();
		
		//////////////////////////////////////////////////////////
		// registry ulities
		//////////////////////////////////////////////////////////
		private RegistryKey getRegKey() {
			RegistryKey rkSoft = Registry.CurrentUser.CreateSubKey("Software");
			RegistryKey rkHelper = rkSoft.CreateSubKey("GadgetHelper");
			return rkHelper.CreateSubKey("WindowManager");
		}
		private void verifyRegConfig(RegistryKey rk) {
			if (rk.GetValue("maxIndex") == null || rk.GetValueKind("maxIndex") != RegistryValueKind.DWord)
				rk.SetValue("maxIndex", 5);
			if (rk.GetValue("ignClass") == null || rk.GetValueKind("ignClass") != RegistryValueKind.MultiString)
				rk.SetValue("ignClass", new String[] {
					"tooltips_class32",
					"Shell_TrayWnd",
					"NotifyIconOverflowWindow",
					"Desktop User Picture",
					"DV2ControlHost",
					"Progman",
					"WorkerW",
					"Alternate Owner",
					"Internet Explorer_Hidden",
					"Button",
					"SysShadow"
				}, RegistryValueKind.MultiString);
			if (rk.GetValue("ignProcess") == null || rk.GetValueKind("ignProcess") != RegistryValueKind.MultiString)
				rk.SetValue("ignProcess", new String[] {
					"BasicWindow"
				}, RegistryValueKind.MultiString);
		}
		private WndFilter parseWndFilter(RegistryKey rk) {
			WndFilter wf = new WndFilter();
			wf.wndList = new List<int>();
			
			String[] ignClasses = (String[])rk.GetValue("ignClass", new String[0]);
			wf.ignClass = new List<String>();
			foreach (String className in ignClasses) {
				wf.ignClass.Add(className);
			}
			
			String[] procClasses = (String[])rk.GetValue("ignProcess", new String[0]);
			wf.ignProcess = new List<int>();
			foreach (String className in procClasses) {
				int proc = 0;
				IntPtr wnd = FindWindow(className, null);
				if (wnd != IntPtr.Zero) {
					GetWindowThreadProcessId(wnd, out proc);
					if (proc != 0) wf.ignProcess.Add(proc);
				}
			}
			return wf;
		}
		
		//////////////////////////////////////////////////////////
		// event implement
		//////////////////////////////////////////////////////////
		private GroupChangeHandle GroupChangeEvent;
		private void attachGroupChange() {
			if (waitThreadId == 0) {
				waitThreadId = GetCurrentThreadId();
				waitChange = new EventWaitHandle(false, EventResetMode.AutoReset, "wmGroupChanged"+waitThreadId.ToString());
				waitRegisted = ThreadPool.RegisterWaitForSingleObject(waitChange, OnGroupChanged, null, -1, false);
				RegistryKey rkInst = getRegKey().CreateSubKey("instance");
				rkInst.SetValue(waitThreadId.ToString(), 1);
			}
		}
		private void dettachGroupChange() {
			if (waitThreadId != 0) {
				waitRegisted.Unregister(waitChange);
				RegistryKey rkInst = getRegKey().CreateSubKey("instance");
				rkInst.DeleteValue(waitThreadId.ToString());
				waitRegisted = null;
				waitChange = null;
				waitThreadId = 0;
			}
		}
		
		//////////////////////////////////////////////////////////
		// cross-thread notify
		//////////////////////////////////////////////////////////
		private RegisteredWaitHandle waitRegisted;
		private EventWaitHandle waitChange;
		private int waitThreadId;
		private void OnGroupChanged(object state, bool timeout) {
			if (GroupChangeEvent != null)
				GroupChangeEvent(getCurrentGroup());
			RegistryKey rkInst = getRegKey().CreateSubKey("instance");
			rkInst.SetValue(waitThreadId.ToString(), 1);
		}
		private void fireThreadNotify(int index) {
			if (waitThreadId == 0 && GroupChangeEvent != null)
				GroupChangeEvent(index);
			RegistryKey rkInst = getRegKey().CreateSubKey("instance");
			String[] entries = rkInst.GetValueNames();
			foreach (String entry in entries) {
				EventWaitHandle waitEvent = new EventWaitHandle(false, EventResetMode.AutoReset, "wmGroupChanged"+entry);
				waitEvent.Set();
				rkInst.DeleteValue(entry);
			}
		}
		
		//////////////////////////////////////////////////////////
		// group save operation
		//////////////////////////////////////////////////////////
		private WndSaveData getGroupWndSaveData(int index) {
			RegistryKey rk = getRegKey();
			if (index == (int)rk.GetValue("index", -1)) {
				WndFilter wf = parseWndFilter(rk);				
				object wfRef = wf;
				EnumDesktopWindows(IntPtr.Zero, new EnumCallback(FindHideWindow), ref wfRef);
				return new WndSaveData(wf.wndList.ToArray(), GetForegroundWindow().ToInt32());
			}
			else {
				String data = (String)rk.GetValue(index.ToString());
				JavaScriptSerializer ser = new JavaScriptSerializer();
				return (data != null && data.Length > 0) ? ser.Deserialize<WndSaveData>(data) : new WndSaveData(new int[0], 0);
			}
		}
		private List<int> parseWndListMove(String list) {
			List<int> wndList = new List<int>();
			String[] ignWndStr = list.Split(',');
			foreach (String wndStr in ignWndStr) {
				int wnd = 0;
				int.TryParse(wndStr, out wnd);
				if (IsWindow(new IntPtr(wnd)))
					wndList.Add(wnd);
			}
			return wndList;
		}
		private void updateWndListMove(ref WndSaveData from, ref WndSaveData to, List<int> listMove) {
			List<int> listFrom = new List<int>();
			foreach (int wnd in from.l) {
				if (!listMove.Contains(wnd))
					listFrom.Add(wnd);
			}
			from.l = listFrom.ToArray();
			
			List<int> listTo = new List<int>();
			foreach (int wnd in to.l) {
				if (!listTo.Contains(wnd))
					listTo.Add(wnd);
			}
			foreach (int wnd in listMove) {
				if (!listTo.Contains(wnd))
					listTo.Add(wnd);
			}
			to.l = listTo.ToArray();
		}
		
		//////////////////////////////////////////////////////////
		// windows control
		//////////////////////////////////////////////////////////
		private void hideWndList(WndSaveData wd) {
			foreach (int wnd in wd.l) {
				IntPtr hwnd = new IntPtr(wnd);
				ShowWindowAsync(hwnd, 0/*SW_HIDE*/);
			}
		}
		private void restoreWndList(WndSaveData wd) {
			IntPtr hwnd = IntPtr.Zero, hactive = IntPtr.Zero;
			foreach (int wnd in wd.l) {
				hwnd = new IntPtr(wnd);
				if (wnd == wd.a)
					hactive = hwnd;
				else if (IsWindow(hwnd))
					ShowWindowAsync(hwnd, 8/*SW_SHOWNA*/);
			}
			if (IsWindow(hactive)) {
				hwnd = hactive;
				//while (GetParent(hwnd) != IntPtr.Zero)
				//	hwnd = GetParent(hwnd);
				ShowWindowAsync(hwnd, 5/*SW_SHOW*/);
				BringWindowToTop(hwnd);
				SetForegroundWindow(hwnd);
			}
		}
		
		//////////////////////////////////////////////////////////
		// windows icon utilies
		//////////////////////////////////////////////////////////
		//private void extractIconToFile(IntPtr hwnd, String path) {
		//}
	}
}
