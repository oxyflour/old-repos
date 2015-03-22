using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

using DxLibDLL;

public abstract class Canvas {

	public const int width = 128;
	public const int height = 64;

	public abstract void Resize(int width, int height);
	public abstract void Dispose();

	public abstract void BeginRender();
	public abstract void EndRender();

	public abstract void Clear(Color color);
	public abstract void DrawPixel(int x, int y, Color color);
	
	//public abstract void DrawString(int x, int y, string text, Color color);

}

public class GdiCanvas : Canvas {

	static Font font = new Font("Arial", 10);

	static Dictionary<Color, Brush> brushes = new Dictionary<Color, Brush>();

	public static Brush GetBrush(Color color) {

		if (!brushes.ContainsKey(color))
			brushes.Add(color, new SolidBrush(color));

		return brushes[color];

	}

	int realWidth;
	int realHeight;

	Form form;

	Graphics graphics;

	public GdiCanvas(Form form, int newWidth, int newHeight) {
		this.form = form;

		// Note: enable double buffering in an EVIL way
		// ref: https://msdn.microsoft.com/en-us/library/3t7htc9c(v=vs.110).aspx
		// ref: http://stackoverflow.com/questions/76993/how-to-double-buffer-net-controls-on-a-form
		System.Reflection.PropertyInfo prop =
			typeof(System.Windows.Forms.Control).GetProperty(
				"DoubleBuffered", 
				System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
		prop.SetValue(form, true, null); 

		Resize(newWidth, newHeight);

	}

	public override void Resize(int newWidth, int newHeight) {
		if (graphics != null)
			graphics.Dispose();
		graphics = form.CreateGraphics();

		realWidth = newWidth;
		realHeight = newHeight;

	}

	public override void Dispose() {
		if (graphics != null)
			graphics.Dispose();
		graphics = null;

	}

	public override void BeginRender() {

	}

	public override void EndRender() {
		graphics.CopyFromScreen(
			new Point(0, 0),
			new Point(realWidth, realHeight),
			new Size(realWidth, realHeight));
	}

	public override void Clear(Color color) {

		graphics.Clear(color);

	}

	/*
	public override void DrawString(int x, int y, string text, Color color) {

		graphics.DrawString(text, font, GetBrush(color), x, y);

	}
	*/

	public override void DrawPixel(int x, int y, Color color) {

		graphics.FillRectangle(
			GetBrush(color),
			new Rectangle(
				realWidth / width * x,
				realHeight / height * y,
				realWidth / width,
				realHeight / height)
			);

	}

}

public class DxCanvas : Canvas {

	int pixelWidth;
	int pixelHeight;

	public DxCanvas(Form form, int newWidth, int newHeight) {

		DX.SetUserWindow(form.Handle);
		DX.DxLib_Init();

		Resize(newWidth, newHeight);

	}

	public override void Resize(int newWidth, int newHeight) {

		pixelWidth = newWidth / width;
		pixelHeight = newHeight / height;

		DX.SetGraphMode(newWidth, newHeight, 32);
        DX.SetDrawScreen(DX.DX_SCREEN_BACK);

	}

	public override void Dispose() {

		DX.DxLib_End();

	}

	public override void BeginRender() {

	}

	public override void EndRender() {

        DX.ScreenFlip();

	}

	public override void Clear(Color color) {

		DX.SetBackgroundColor(color.R, color.G, color.B);
        DX.ClearDrawScreen();

	}

	public override void DrawPixel(int x, int y, Color color) {

		DX.DrawBox(
			x*pixelWidth, y*pixelHeight,
			x*pixelWidth + pixelWidth, y*pixelHeight + pixelHeight,
			color.ToArgb(), 1);

	}

}
