using System.Windows.Forms;
using System.Collections.Generic;

// Note: we are not using System.Windows.Input.Keyboard,
//       because it requires PresentationCore.dll
public class KeyStates {

	Dictionary<Keys, bool> keys = new Dictionary<Keys, bool>();

	public KeyStates() {

	}

	public void setKeyState(Keys key, bool down) {
		keys[key] = down;
	}

	public bool isKeyDown(Keys key) {
		return keys.ContainsKey(key) && keys[key];
	}

}

public class FpsCounter {

	int[] ticks = new int[60];

	int index = 0;

	public FpsCounter() {

	}

	public void Update() {

		ticks[index] = System.Environment.TickCount;
		index = (index + 1) % ticks.Length;

	}

	public double Get() {

		int last = index > 0 ? index - 1 % ticks.Length : ticks.Length - 1;
		return 1000.0 * (ticks.Length - 1) / (ticks[last] - ticks[index]);

	}

}
