using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;

namespace GadgetHelper{
	[ComVisible(true)]
	[Guid("8C1A58BE-7F19-4335-B9F5-C9C3EAD697C7")]
	[InterfaceType(ComInterfaceType.InterfaceIsDual)]
	public interface IShlMgr {
		[DispId(9)]
		bool fileExists(String path);
		[DispId(10)]
		String getFileInfoJSON(String path);
		//[DispId(11)]
		//String getLinkInfoJSON(String path);
		[DispId(12)]
		String getFilesJSON(String path);
		[DispId(13)]
		String getFoldersJSON(String path);
	}
	[ComVisible(true)]
	[Guid("7A0C5D75-3D8F-4357-B3AA-FA03BD740FC2")]
	[ClassInterface(ClassInterfaceType.None)]
	public class ShellManager:IShlMgr {
		public bool fileExists(String path) {
			return Directory.Exists(path) || File.Exists(path);
		}
		
		public String getFileInfoJSON(String path) {
			FsInfo fi = new FsInfo();
			if (File.Exists(path)) {
				FileInfo info = new FileInfo(path);
				fi.name = info.Name;
				fi.path = info.FullName;
				fi.createTime = info.CreationTime.ToString();
				fi.extName = info.Extension;
			}
			return (new JavaScriptSerializer()).Serialize(fi);
		}
		public String getFilesJSON(String path) {
			String[] files = Directory.Exists(path) ? Directory.GetFiles(path) : new String[0];
			return (new JavaScriptSerializer()).Serialize(files);
		}
		public String getFoldersJSON(String path) {
			String[] folders = Directory.Exists(path) ? Directory.GetDirectories(path) : new String[0];
			return (new JavaScriptSerializer()).Serialize(folders);
		}
		
		public class FsInfo {
			public String name;
			public String path;
			public String createTime;
			public String extName;
		}
	}
}