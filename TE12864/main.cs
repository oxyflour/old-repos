using System;
using System.Windows.Forms;

public class MainForm : Form {

	Canvas canvas;

	Game game;

	KeyStates keys = new KeyStates();

	FpsCounter fps = new FpsCounter();

	int lastTick = Environment.TickCount;

	int fpsTick = Environment.TickCount;

	public MainForm() {

		// update this to use DxCanvas
		canvas = new DxCanvas(this, ClientSize.Width, ClientSize.Height);

		// update this line to create your own game
		game = new DemoGame();

		// attach events
		Closed += (sender, e) => {
			canvas.Dispose();
		};

		Load += (sender, e) => {
			ResizeForCanvas();
		};

		ResizeEnd += (sender, e) => {
			ResizeForCanvas();
		};

		KeyDown += (sender, e) => {
			keys.setKeyState(e.KeyCode, true);
		};

		KeyUp += (sender, e) => {
			keys.setKeyState(e.KeyCode, false);
		};

	}

	public void ResizeForCanvas() {

		// Note: we keep the client width/height divisible by canvas width/height
		int width = ClientSize.Width / Canvas.width * Canvas.width;
		int height = ClientSize.Height / Canvas.height * Canvas.height;
		SetClientSizeCore(width, height);

		canvas.Resize(width, height);

	}

	public void Loop() {

		int tick = Environment.TickCount;

		// Note: our game will approximately update 50 times in 1s
		for (; tick >= lastTick + 20; lastTick += 20)
			game.Update(20, keys);

		for (; tick >= fpsTick + 1000; fpsTick += 1000)
			Text = String.Format("Emu12864 {0}x{1} {2:F1}fps", ClientSize.Width, ClientSize.Height, fps.Get());

		// render the game
		canvas.BeginRender();
		game.Render(canvas);
		canvas.EndRender();

		fps.Update();

	}

	[STAThread]
	public static void Main() {

		// ref: http://qiita.com/hart_edsf/items/0301f17e2d9acd890c5e
		Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        using (MainForm form = new MainForm()) {

        	form.Show();

        	// Note: there may be some issues with this.
			// see http://blogs.msdn.com/b/rickhos/archive/2005/03/30/403952.aspx
        	while (form.Created) {
        		form.Loop();
        		Application.DoEvents();
        	}

        }
	}
}