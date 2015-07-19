using System.Drawing;
using System.Windows.Forms;

public abstract class Game {

	public abstract void Update(int dt, KeyStates ks);

	public abstract void Render(Canvas cv);

}

public class DemoGame : Game {

	public class Tree {

		public int position;

		public int height;

	}

	public class Ground {

		public const double position = 60;
		public const int width = Canvas.width;
		public const int height = 2;

		double px = 0;
		double py = position;
		double vx = 0.03;
		double dx = 0;

		Tree[] trees = new Tree[5];
		System.Random rand = new System.Random();

		public Ground() {

			for (int i = 0; i < trees.Length; i ++)
				trees[i] = new Tree();

		}

		public double GetDistance() {

			return px;

		}

		public void Update(int dt) {

			dx = vx * dt;
			px += dx;

			// make it more interesting
			vx += 0.00002;

			foreach (Tree tree in trees) {
				if (tree.position < px) {
					tree.position = (int)(px + width + rand.NextDouble() * width * 2);
					tree.height = (int)(5 + 15 * rand.NextDouble());
				}
			}

		}

		public void Render(Canvas cv) {

			int ix = (int)px;
			int iy = (int)py;

			for (int x = ix; x < ix + width; x ++)
				for (int y = iy; y < iy + height; y ++)
					if ((x + y + 1) % 4 == 0) cv.DrawPixel(x - ix, y, Color.Red);

			foreach (Tree tree in trees)
				for (int y = iy-1; y > iy-tree.height; y --)
					cv.DrawPixel(tree.position - ix, y, Color.Green);

		}

		public bool TestHitWith(PointF position) {

			foreach (Tree tree in trees) {
				RectangleF rect = new RectangleF(
					(float)(tree.position - px),
					(float)(py - tree.height + 1),
					(float)(1 + dx),
					(float)tree.height);
				if (rect.Contains(position))
					return true;
			}

			return false;

		}

	}

	public class Player {

		public const double gravity = 0.0003;
		public const double jumpVelocity = -0.05;
		public const double jumpAcceleration = -0.015;

		double px = Canvas.width / 2;
		double py = Ground.position;
		double vy = 0;

		public Player() {

		}

		public PointF GetPosition() {

			return new PointF((float)px, (float)py);

		}

		public void Update(int dt) {

			vy += gravity * dt;
			py += vy * dt;

			if (py > Ground.position) {
				py = Ground.position;
				vy = 0;
			}

		}

		public void Jump() {

			if (py == Ground.position && vy == 0)
				vy = jumpVelocity;
			else if (py > Canvas.height / 2 && vy < 0)
				vy += jumpAcceleration;

		}

		public void Render(Canvas cv) {

			cv.DrawPixel((int)px, (int)py - 1, Color.Blue);

		}

	}

	Ground ground;

	Player player;

	bool started;

	public DemoGame() {

		Restart();

	}

	public void Restart() {

		ground = new Ground();

		player = new Player();

		started = true;

	}

	public void Stop() {

		started = false;

	}

	public override void Update(int dt, KeyStates ks) {

		if (started) {

			ground.Update(dt);

			player.Update(dt);

			if (ks.isKeyDown(Keys.Space))
				player.Jump();

			if (ground.TestHitWith(player.GetPosition()))
				Stop();

		}

		else {

			if (ks.isKeyDown(Keys.Space))
				Restart();

		}

	}

	public override void Render(Canvas cv) {

		cv.Clear(Color.White);

		// Warning: DrawString causes serious flickering!
		//cv.DrawString(0, 0, "pts: "+(int)ground.GetDistance(), Color.Black);

		ground.Render(cv);

		player.Render(cv);

	}

}