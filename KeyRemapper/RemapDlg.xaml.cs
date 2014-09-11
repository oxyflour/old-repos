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
using System.Windows.Shapes;

namespace KeyRemapper
{
    /// <summary>
    /// Interaction logic for RemapDlg.xaml
    /// </summary>
    public partial class RemapDlg : Window
    {
        public SetMode nRet;
        public RemapDlg()
        {
            nRet = SetMode.NoSet;
            InitializeComponent();
        }
        public void CenterInOwner(Window Owner)
        {
            this.Owner = Owner;
            this.Left = Owner.Left + Owner.Width / 2 - this.Width / 2;
            this.Top = Owner.Top + Owner.Height / 2 - this.Height / 2;
        }
        private void ButtonClick(object sender, RoutedEventArgs e)
        {
            Button b = (Button)sender;
            if (b == Shield)
                nRet = SetMode.Shield;
            else if (b == Reset)
                nRet = SetMode.Reset;
            this.Close();
        }
        private void WindowKeyDown(object sender, KeyEventArgs e)
        {
            nRet = SetMode.SetCurrent;
            this.Close();
        }
    }
}
