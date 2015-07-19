using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace KeyRemapper
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private keybdHook hook;
        private String[] vkNames;
        //构造器
        public MainWindow()
        {
            hook = new keybdHook();
            vkNames = new String[256];
            InitialVkNames();
            InitializeComponent();
        }
        //事件
        private void WindowLoaded(object sender, RoutedEventArgs e)
        {
            if (hook.StartHook() == false)
                MessageBox.Show("Error hooking keyboard!\nYou might have to restart the programme.");
        }
        private void WindowClosed(object sender, EventArgs e)
        {
            hook.StopHook();
        }
        private void ButtonLoaded(object sender, RoutedEventArgs e)
        {
            KeyButton b = (KeyButton)sender;
            b.Content = vkNames[b.vkCode];
        }
        private void ButtonClick(object sender, RoutedEventArgs e)
        {
            RemapDlg dlg = new RemapDlg();
            dlg.CenterInOwner(this);
            dlg.ShowDialog();
            SetKey((KeyButton)sender, dlg.nRet);
        }
        private void OnControl(object sender, RoutedEventArgs e)
        {
            Button b = (Button)sender;
            if (b.Content.ToString() == "Shield")
                SetKeys(this, SetMode.Shield);
            else if (b.Content.ToString() == "Reset")
                SetKeys(this, SetMode.Reset);
            else if (b.Content.ToString() == "Save")
                hook.Save("DefaultKeyMap.kme");
            else if (b.Content.ToString() == "Load")
                SetKeys(this, hook.Load("DefaultKeyMap.kme"));
        }
        //方法
        private void SetKey(KeyButton kb, SetMode sm)
        {
            int rep = hook.SetKeyMap(kb.vkCode, sm);
            kb.Foreground = (rep == kb.vkCode) ? Brushes.Black : Brushes.DeepSkyBlue;
            kb.Content = vkNames[rep];
        }
        private void SetKeys(object o, SetMode sm)
        {
            if (!(o is DependencyObject)) return;
            if (o is KeyButton)
                SetKey((KeyButton)o, sm);
            foreach (object child in LogicalTreeHelper.GetChildren(o as DependencyObject))
                SetKeys(child, sm);
        }
        private void InitialVkNames()
        {
            vkNames[255] = "XXX";

            vkNames[27] = "Esc";
            vkNames[112] = "F1";
            vkNames[113] = "F2";
            vkNames[114] = "F3";
            vkNames[115] = "F4";
            vkNames[116] = "F5";
            vkNames[117] = "F6";
            vkNames[118] = "F7";
            vkNames[119] = "F8";
            vkNames[120] = "F9";
            vkNames[121] = "F10";
            vkNames[122] = "F11";
            vkNames[123] = "F12";

            vkNames[192] = "`";
            vkNames[49] = "1";
            vkNames[50] = "2";
            vkNames[51] = "3";
            vkNames[52] = "4";
            vkNames[53] = "5";
            vkNames[54] = "6";
            vkNames[55] = "7";
            vkNames[56] = "8";
            vkNames[57] = "9";
            vkNames[48] = "0";
            vkNames[189] = "-";
            vkNames[187] = "=";
            vkNames[8] = "BackSpace";

            vkNames[9] = "Tab";
            vkNames[81] = "Q";
            vkNames[87] = "W";
            vkNames[69] = "E";
            vkNames[82] = "R";
            vkNames[84] = "T";
            vkNames[89] = "Y";
            vkNames[85] = "U";
            vkNames[73] = "I";
            vkNames[79] = "O";
            vkNames[80] = "P";
            vkNames[219] = "[";
            vkNames[221] = "]";
            vkNames[220] = "\\";

            vkNames[20] = "Caps";
            vkNames[65] = "A";
            vkNames[83] = "S";
            vkNames[68] = "D";
            vkNames[70] = "F";
            vkNames[71] = "G";
            vkNames[72] = "H";
            vkNames[74] = "J";
            vkNames[75] = "K";
            vkNames[76] = "L";
            vkNames[186] = ";";
            vkNames[222] = "'";
            vkNames[13] = "Return";

            vkNames[160] = "Shift";
            vkNames[90] = "Z";
            vkNames[88] = "X";
            vkNames[67] = "C";
            vkNames[86] = "V";
            vkNames[66] = "B";
            vkNames[78] = "N";
            vkNames[77] = "M";
            vkNames[188] = ",";
            vkNames[190] = ".";
            vkNames[191] = "/";
            vkNames[161] = "Shift";

            vkNames[162] = "Ctrl";
            vkNames[91] = "Win";
            vkNames[164] = "Alt";
            vkNames[32] = "Space";
            vkNames[165] = "Alt";
            vkNames[92] = "Win";
            vkNames[93] = "App";
            vkNames[163] = "Ctrl";

            vkNames[44] = "PrtScr";
            vkNames[145] = "SroLock";
            vkNames[19] = "Pause";

            vkNames[45] = "Insert";
            vkNames[36] = "Home";
            vkNames[33] = "PgUp";

            vkNames[46] = "Delete";
            vkNames[35] = "End";
            vkNames[34] = "PgDown";

            vkNames[38] = "Up";

            vkNames[37] = "Left";
            vkNames[40] = "Down";
            vkNames[39] = "Right";
        }
    }
}
