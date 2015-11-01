<%@ WebService Language="C#" Class="apmSrv" %>
// vi:syntax=cs

using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Services;
using System.Web.Services.Protocols;
using System.Web.Security;
using System.Web.Script.Services;

[WebService(Namespace = "http://tempuri.org/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
// 若要允许使用 ASP.NET AJAX 从脚本中调用此 Web 服务，请取消注释以下行。 
[System.Web.Script.Services.ScriptService]
public class apmSrv  : System.Web.Services.WebService {
	public class Result {
		public String error;
		public object data;
		public Result() {
			error = "";
			data = null;
		}
		public Result(object d) {
			error = "";
			data = d;
		}
		public Result(String e) {
			error = e;
			data = null;
		}
	}
	public SqlDataReader SqlQuery(String cmdStr, bool retReader) {
		String strConn = System.Configuration.ConfigurationManager.ConnectionStrings["apmConn"].ConnectionString;
        SqlConnection conn = new SqlConnection(strConn);
        SqlCommand cmd = new SqlCommand(cmdStr, conn);
        conn.Open();
        if (retReader)
            return cmd.ExecuteReader();
        cmd.ExecuteNonQuery();
        return null;
    }
	public String SqlString(String Htmlstring) {
		// from http://bbs.csdn.net/topics/330099924

		//删除脚本
		Htmlstring = Regex.Replace(Htmlstring, @"<script[^>]*?>.*?</script>", "", RegexOptions.IgnoreCase);
		//删除HTML
		Htmlstring = Regex.Replace(Htmlstring, @"<(.[^>]*)>", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"([\r\n])[\s]+", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"-->", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"<!--.*", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(quot|#34);", "\"", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(amp|#38);", "&", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(lt|#60);", "<", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(gt|#62);", ">", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(nbsp|#160);", " ", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(iexcl|#161);", "\xa1", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(cent|#162);", "\xa2", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(pound|#163);", "\xa3", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&(copy|#169);", "\xa9", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, @"&#(\d+);", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "xp_cmdshell", "", RegexOptions.IgnoreCase);

		/*
		//删除与数据库相关的词
		Htmlstring = Regex.Replace(Htmlstring, "select", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "insert", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "delete from", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "count''", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "drop table", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "truncate", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "asc", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "mid", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "char", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "xp_cmdshell", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "exec master", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "net localgroup administrators", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "and", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "net user", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "or", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "net", "", RegexOptions.IgnoreCase);
		//Htmlstring = Regex.Replace(Htmlstring, "*", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "-", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "delete", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "drop", "", RegexOptions.IgnoreCase);
		Htmlstring = Regex.Replace(Htmlstring, "script", "", RegexOptions.IgnoreCase);
		*/

		//特殊的字符
//		Htmlstring = Htmlstring.Replace("<", "");
//		Htmlstring = Htmlstring.Replace(">", "");
//		Htmlstring = Htmlstring.Replace("*", "");
//		Htmlstring = Htmlstring.Replace("-", "");
//		Htmlstring = Htmlstring.Replace("?", "");
		Htmlstring = Htmlstring.Replace("'", "''");
//		Htmlstring = Htmlstring.Replace(",", "");
//		Htmlstring = Htmlstring.Replace("/", "");
//		Htmlstring = Htmlstring.Replace(";", "");
//		Htmlstring = Htmlstring.Replace("*/", "");
//		Htmlstring = Htmlstring.Replace("\r\n", "");
		Htmlstring = HttpContext.Current.Server.HtmlEncode(Htmlstring).Trim();

		return Htmlstring;
	}
        
	/*
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
	public Result InitPwd() {
        SqlDataReader dr = SqlQuery("select * from users", true);
		String cmd = "";
        while (dr.Read()) {
			int id = int.Parse(dr["id"].ToString());
			String username = dr["username"].ToString();
			char[] a = username.ToCharArray();
			Array.Reverse(a);
			String pwd = FormsAuthentication.HashPasswordForStoringInConfigFile(new String(a), "MD5");
			if (dr["password"].ToString() == "")
				cmd += "update users set password='" + pwd + "' where id=" + id;
		}
		SqlQuery(cmd, false);
		return new Result((object)true);
	}
	*/

	public class User {
		public int id;
		public String username;
		public String name;
		public int admin;
		public String contact;
		public String reslist;
	}
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result GetUser(String username, String password) {
		username = SqlString(username);
		String pwd = FormsAuthentication.HashPasswordForStoringInConfigFile(password, "MD5");
		SqlDataReader dr = null;
		if (username != "" && password != "")
        	dr = SqlQuery("select * from users where (username='" + username + "') and (password='" + pwd + "')", true);
		else if (username == "" && password == "" && Session["uid"] != null)
        	dr = SqlQuery("select * from users where (id='" + Session["uid"].ToString() + "')", true);
		else {
        	Session["uid"] = Session["admin"] = null;
			return new Result("please login");
		}
        if (dr != null && dr.Read()) {
			Session["uid"] = int.Parse(dr["id"].ToString());
			Session["admin"] = int.Parse(dr["admin"].ToString());
			Session["reslist"] = dr["reslist"].ToString();
			User u = new User() {
				id = (int)Session["uid"], 
				username = dr["username"].ToString(),
				name = dr["name"].ToString(),
				admin = (int)Session["admin"],
				contact = dr["contact"].ToString(),
				reslist = Session["reslist"].ToString(),
			};
			return new Result((object)u);
        }
		else {
        	Session["uid"] = Session["admin"] = null;
			return new Result("login failed");
		}
    }
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result ListUser() {
        if (Session["uid"] == null)
			return new Result("please login");
		int admin = (int)Session["admin"];
		if (!(admin > 0))
			return new Result("illegal access");

		SqlDataReader dr = SqlQuery("select * from users", true);
        List<User> ls = new List<User>();
        while (dr.Read()) {
            ls.Add(new User() {
				id = int.Parse(dr["id"].ToString()), 
				username = dr["username"].ToString(),
				name = dr["name"].ToString(),
				admin = int.Parse(dr["admin"].ToString()),
				contact = dr["contact"].ToString(),
				reslist = dr["reslist"].ToString(),
            });
        }
        dr.Close();
		return new Result((object)ls);
	}
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result UpdateUser(int id, String username, String name, String contact, String password,
    		int admin, String reslist) {
        if (Session["uid"] == null)
			return new Result("please login");

		username = SqlString(username);
		name = SqlString(name);
		contact = SqlString(contact);
		String pwd = FormsAuthentication.HashPasswordForStoringInConfigFile(password, "MD5");
		reslist = Regex.Replace(reslist, @"[^0-9,\+-]", "", RegexOptions.IgnoreCase);

		int uid = (int)Session["uid"], uadmin = (int)Session["admin"];
		if (!(uadmin > 0) && uid != id)
			return new Result("illegal access");
		if (!(uadmin > 0)) {
			admin = -1;
			reslist = "#";
		}

		String cmd = "";
		if (id > 0 && username != "") {
			cmd = "update users set name='" + name + "', contact='" + contact + "'";
			if (password != "")
				cmd += ", password='" + pwd + "'";
			if (admin >= 0)
				cmd += ", admin=" + admin;
			if (reslist != "#")
				cmd += ", reslist='" + reslist + "'";
			cmd += " where id=" + id;
		}
		else if (id > 0 && username == "") {
			cmd = "delete from users where id="+id;
		}
		else {
			cmd = "insert into users (username, name, contact, password, admin) "+
				"values ('" + username + "', '" + name + "', '" + contact + "', '" + pwd + "', 0)";
		}
		SqlQuery(cmd, false);
		return new Result((object)true);
	}

    public class ResElem {
        public int id;
        public String name;
        public String addr;
        public String desp;
    }
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
	public Result ListRes() {
		String cmd = "select * from resource";
		String res = Session["reslist"].ToString();
		if (res != null && res != "" && (res[0] == '+' || res[0] == '-')) {
			String b = res[0] == '+' ? "in" : "not in";
			String l = res.Substring(1);
			cmd += " where id " + b + " (" + l + ")";
		}
        SqlDataReader dr = SqlQuery(cmd, true);
        List<ResElem> ls = new List<ResElem>();
        while (dr.Read()) {
            ls.Add(new ResElem() {
                id = int.Parse(dr["id"].ToString()),
                name = dr["name"].ToString(),
                addr = dr["address"].ToString(),
                desp = dr["description"].ToString()
            });
        }
        dr.Close();
		return new Result((object)ls);
	}

    public class EventNode {
        public int id;
        public int rid;
        public String roomname;
        public int uid;
        public String username;
        public String date;
        public int begin;
        public int end;
        public String reason;
        public String contact;
    }
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result Query(List<String> dates, List<int> rids) {
		if (dates.Count < 1)
			return new Result("at least one date is required!");
        String cmd = "select e.*, u.name as uname, r.name as rname from events as e" +
            " left join users as u on (e.uid=u.id) left join resource as r on (e.rid=r.id)" +
            " where (date in ('" + string.Join("','", dates.ToArray()) + "'))" +
            (rids.Count > 0 ? " and (e.rid in " + 
			"(" + string.Join(",", rids.ConvertAll(i => i.ToString()).ToArray()) + "))" : "") +
            " order by e.tbegin";
        SqlDataReader dr = SqlQuery(cmd, true);
        List<EventNode> ls = new List<EventNode>();
        while (dr.Read()) {
            ls.Add(new EventNode() {
                id = int.Parse(dr["id"].ToString()),
                rid = int.Parse(dr["rid"].ToString()),
                roomname = dr["rname"].ToString(),
                uid = int.Parse(dr["uid"].ToString()),
                username = dr["uname"].ToString(),
                date = dr["date"].ToString(),
                begin = int.Parse(dr["tbegin"].ToString()),
                end = int.Parse(dr["tend"].ToString()),
                reason = dr["reason"].ToString(),
                contact = dr["contact"].ToString()
            });
        }
		return new Result((object)ls);
    }

    public class EventNode2 {
        public int id;
        public int uid;
        public int begin;
        public int end;
        public String reason;
        public String contact;
    }
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result Require(int id, int rid, String date, int begin, int end, String reason, String contact) {
		// auth is required
        if (Session["uid"] == null)
			return new Result("please login");
		int uid = (int)Session["uid"], admin = (int)Session["admin"];

		date = SqlString(date);
		reason = SqlString(reason);
		contact = SqlString(contact);

		// setup times
        if (begin < 0) begin = 0;
        if (end > 24 * 60) end = 24 * 60;
		if (begin >= end) end = begin;

        String cmd = "select id, uid, tbegin, tend, reason from events "+
            "where (date='" + date + "') and (rid=" + rid + ") and (" +
				"(tbegin>=" + begin + " and tbegin<=" + end + ") or " + 
				"(tend>=" + begin + " and tend<=" + end + ") or " +
				"(tbegin<=" + begin + " and tend>=" + end + ")" + 
			") order by tbegin";
        SqlDataReader dr = SqlQuery(cmd, true);

		EventNode2 nU = null, nB = null, nE = null;
		List<EventNode2> nD = new List<EventNode2>();
        while (dr.Read()) {
            EventNode2 n = new EventNode2() {
                id = int.Parse(dr["id"].ToString()),
                uid = int.Parse(dr["uid"].ToString()),
                begin = int.Parse(dr["tbegin"].ToString()),
                end = int.Parse(dr["tend"].ToString()),
                reason = dr["reason"].ToString()
            };
			if (n.id == id)
				nU = n;
			else if (n.begin <= begin && n.end >= end)
				nU = n;
			else if (n.begin < begin && n.end <= end)
				nB = n;
			else if (n.begin >= begin && n.end <= end)
				nD.Add(n);
			else if (n.begin <= end && n.end > end)
				nE = n;
		}

		if (nU == null) {
			nU = new EventNode2();
			nU.id = 0;
			nU.uid = uid;
		}
		nU.begin = begin;
		nU.end = end;
		nU.reason = reason;
		nU.contact = contact;

		// verify access
		if (admin <= 0) {
			if (nU.uid != uid ||
				(nB != null && nB.uid != nU.uid && nB.end != begin) ||
				(nE != null && nE.uid != nU.uid && nE.begin != end))
				return new Result("illegal require");
			for (int i = 0; i < nD.Count; i ++) {
				if (nD[i].uid != uid)
					return new Result("illegal require");
			}
		}

		if (nU.begin == nU.end) {
			// this will remove the event
			SqlQuery("delete from events where (id=" + nU.id + ")", false);
			return new Result((object)true);
		}
		else {
			// update events
			if (nB != null && nB.uid == nU.uid && nB.reason == nU.reason) { nU.begin = nB.begin; nD.Add(nB); nB = null; }
			if (nE != null && nE.uid == nU.uid && nE.reason == nU.reason) { nU.end = nE.end; nD.Add(nE); nE = null; }
			cmd = nU.id == 0 ? 
				"insert into events (uid, rid, date, reason, contact, tbegin, tend) "+
					"values ("+nU.uid+", "+rid+", '"+date+"', '"+nU.reason+"', '"+nU.contact+"', "+nU.begin+", "+nU.end+");" : 
				"update events set tbegin="+nU.begin+", tend="+nU.end+", reason='"+nU.reason+"', contact='"+nU.contact+"' where (id="+nU.id+");";
			if (nB != null && nB.end != begin)
				cmd += "update events set tend=" + begin + " where (id=" + nB.id + ");";
			if (nE != null && nE.begin != end)
				cmd += "update events set tbegin=" + end + " where (id=" + nE.id + ");";
			if (nD.Count > 0) cmd += "delete from events where id in " + 
				"(" + string.Join(",", nD.ConvertAll(i => i.id.ToString()).ToArray()) + ");";

			SqlQuery(cmd, false);
			return new Result((object)true);
		}
	}
	/*
    public class EventNode2 {
        public int id;
        public int uid;
        public int time;
        public String reason;
    }
    [WebMethod(EnableSession = true)]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public Result Require(int rid, String date, int begin, int end, String reason) {
		// ....
        Session["uid"] = 1;
        if (Session["uid"] == null) return new Result("need login");

        if (begin < 0) begin = 0;
        if (end > 24 * 60) end = 24 * 60;
        int uid = (int)Session["uid"];
        if (reason == "") uid = 0; // this will erasse
        
        String cmd = "select id, uid, time, reason from events "+
            "where (date='" + date + "') and (rid=" + rid + ") and (time<=" + end + ") order by time desc";
        SqlDataReader dr = SqlQuery(cmd, true);
        
        List<EventNode2> ls = new List<EventNode2>();
        EventNode2 n0 = null, nE = null;
        while (dr.Read()) {
            EventNode2 n = new EventNode2() {
                id = int.Parse(dr["id"].ToString()),
                time = int.Parse(dr["time"].ToString()),
                uid = int.Parse(dr["uid"].ToString()),
                reason = dr["reason"].ToString()
            };
            if (n.uid != 0 && n.uid != (int)Session["uid"])
                return new Result("you cannot overwrite other's appointment");
            if (n.time < begin) {
                n0 = n;
                break;
            }
            else {
                if (nE == null) nE = n;
                ls.Add(n);
            }
        }

		cmd = "";
		if (ls.Count > 0) {
			List<int> l = new List<int>();
			for (int i = 0; i < ls.Count; i ++)
				l.Add(ls[i].id);
			cmd += "delete from events where id in (" + string.Join(",", l.ConvertAll(i => i.ToString()).ToArray()) + ");";
		}
		if (n0 == null)
			n0 = new EventNode2() { id = -1, uid = 0, reason = "", time = -1 };
		if (n0.uid != uid || n0.reason != reason)
			cmd += "insert into events (uid, rid, date, reason, time) "+
				"values (" + uid + ", " + rid + ", '" + date + "', '" + reason + "', " + begin + ");";
		if (nE == null) nE = n0;
		if (nE.uid != uid || nE.reason != reason)
			cmd += "insert into events (uid, rid, date, reason, time) " +
				"values (" + nE.uid + ", " + rid + ", '" + date + "', '" + nE.reason + "', " + end + ");";
		if (cmd != "") SqlQuery(cmd, false);
		return new Result((object)true);
    }
	*/
    
}
