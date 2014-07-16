function retself(x) {
	return x;
}
function ieach(ls, fn, d) {
	var n = ls.length, r = undefined;
	for (var i = 0; i < n && r === undefined; i ++)
		r = fn.call(ls, i, ls[i], d);
	return r === undefined ? d : r;
}
function keach(ls, fn, d) {
	for (var i in ls) {
		var r = fn.call(ls, i, ls[i], d);
		if (r !== undefined)
			return r;
	}
	return d;
}
function extend(data, ext) {
	for (var k in ext)
		data[k] = ext[k]
	return data
}
function newTicker(t, f, d) {
	var _t = {
		t: t,
		c: 0,
		d: d,
		f: f,
		run: function(dt) {
			for (_t.c += dt; _t.c >= _t.t; _t.c -= _t.t)
				_t.f(_t.d);
		},
	}
	return _t;
}
function newAnimateList() {
	var _t = [],
		unused = [],
		running = false
	var cleaner = newTicker(1000, function() {
		var nt = _t.length,
			nu = unused.length
		if (nu > 100 || (nt && nu / nt > 0.8))
			_t.clean()
	})

	_t.clean = function() {
		var ls = _t.filter(retself);
		_t.length = unused.length = 0;
		_t.push.apply(_t, ls);
	}
	_t.add = function(t) {
		t.finished = t.disabled = false
		t.init && t.init()
		_t[!running && unused.length ? unused.pop() : _t.length] = t
	}
	_t.run = function(dt) {
		running = true
		for (var i = 0, n = _t.length, t = null; i < n; i ++) {
			if (t = _t[i]) {
				if (t.finished) {
					t.quit && t.quit()
					_t[i] = undefined
					unused.push(i)
				}
				else if (!t.disabled)
					t.run(dt)
			}
		}
		running = false
		cleaner.run(dt)
	}
	return _t;
}

var GAME = (function(THREE) {
	var _t = {}

	_t.keyste = { };
	_t.input = function(e) {
		var ks = _t.keyste
		if (e.sid)	// server side, events from remote
			ks = ks[e.sid] || (ks[e.sid] = {})
		else		// client side, events from local
			_t.socket.emit('input', e)

		ks.shiftKey = e.shiftKey
		ks.ctrlKey = e.ctrlKey

		var c = {
			37: 'LEFT',
			38: 'UP',
			39: 'RIGHT',
			40: 'DOWN',
		}[e.which] || String.fromCharCode(e.which) || c

		if (e.type == 'keydown')
			ks[c] = 1
		else if (e.type == 'keyup')
			ks[c] = 0
	}

	_t.inputs = [];
	_t.localInput = function(e) {
		_t.inputs.push({
			type: e.type,
			which: e.which,
			shiftKey: e.shiftKey,
			ctrlKey: e.ctrlKey
		})
	}
	_t.remoteInput = function(e) {
		_t.inputs.push(e)
	}

	_t.objs = newAnimateList()
	_t.run = function(dt) {
		_t.inputs.forEach(_t.input)
		_t.inputs.length = 0
		_t.objs.run(dt)
	}

	function newClass(create, proto) {
		proto.create = create
		create.prototype = proto
		return create
	}
	function updateVector(v) {
		var d = v.to.clone().sub(v)
		if (d.length() > 1)
			v.add(d.multiplyScalar(0.1))
		else
			v.to = undefined
	}
	_t.Basic = (function(proto) {
		proto.cls = 'Basic'
		return newClass(function(data) {
			if (!data) return
			// extend data into object
			extend(this, data)
			// the mesh should not be controlled yet
			var m = this.mesh;
			if (m && (!m.controller || m.controller.finished)) {
				if (!this.id)
					this.id = m.id
				m.controller = this
				_t.objs.add(this)
			}
		}, proto)
	})({
		init: function() {
			// add velocity
			this.mesh.velocity = new THREE.Vector3()
			_t.scene.add(this.mesh)
			console.log(this.cls + ':' + this.id + ' created')
		},
		run: function(dt) {
			// move!
			var m = this.mesh,
				p = m.position,
				v = m.velocity
			p.add(v)
			// simple interplotation
			if (p.to) updateVector(p)
		},
		quit: function() {
			_t.scene.remove(this.mesh)
			console.log(this.cls + ':' + this.id + ' killed')
		}
	})
	_t.Player = (function(proto) {
		proto.cls = 'Player'
		var run = proto.run
		proto.run = function(dt) {
			var ks = _t.keyste[this.sid]
			if (ks) {
				if (ks.W || ks.UP)
					this.mesh.translateY(0.1*dt)
				if (ks.S || ks.DOWN)
					this.mesh.translateY(-0.1*dt)
				if (ks.A || ks.LEFT)
					this.mesh.rotation.z += 0.001*dt
				if (ks.D || ks.RIGHT)
					this.mesh.rotation.z -= 0.001*dt
			}
			run.apply(this, arguments)
		}
		var create = proto.create
		return newClass(function(data) {
			if (!data) return
			var para = data.para || (data.para = { })
			if (!para.color) {
				var ls = 'red/blue/green/yellow/black/white/orange/gray/pink'.split('/')
				para.color = ls[Math.floor(Math.random() * ls.length)]
			}
			data.mesh = new THREE.Mesh(
				new THREE.BoxGeometry(200, 200, 200),
				new THREE.MeshBasicMaterial({ color: para.color, wireframe: true, })
			)
			data.mesh.geometry.computeBoundingBox()
			data.mesh.position.z -= data.mesh.geometry.boundingBox.min.z - 1
			create.call(this, data)
		}, proto)
	})(new _t.Basic())

	_t.remotes = { }
	_t.getSyncData = function(objs) {
		var data = { }
		data.objs = ieach(objs || _t.objs, function(i, obj, list) {
			if (!obj) return
			var mesh = obj.mesh
			list.push({
				cls: obj.cls,
				id: obj.id,
				sid: obj.sid,
				para: obj.para,
				position: mesh.position.toArray(),
				rotation: mesh.rotation.toArray(),
				velocity: mesh.velocity.toArray(),
			})
		}, [])
		return data
	}
	_t.syncObj = function(d) {
		var obj = _t.remotes[d.id]
		if (obj) {
			obj.mesh.position.to = new THREE.Vector3().fromArray(d.position)
			obj.mesh.rotation.fromArray(d.rotation)
			obj.mesh.velocity.fromArray(d.velocity)
		}
		else {
			obj = new _t[d.cls](d)
			obj.mesh.position.fromArray(d.position)
			obj.mesh.rotation.fromArray(d.rotation)
			obj.mesh.velocity.fromArray(d.velocity)
			_t.remotes[d.id] = obj
		}
		return obj
	}
	_t.loadSyncData = function(data) {
		keach(_t.remotes, function(id, obj) {
			obj.finished = true
		})
		_t.remotes = ieach(data.objs, function(i, d, remotes) {
			var obj = _t.syncObj(d)
			obj.finished = false
			remotes[obj.id] = obj
		}, { })
	}
	_t.addSyncData = function(data) {
		ieach(data.objs, function(i, d) {
			_t.syncObj(d)
		})
	}
	_t.removeSyncData = function(data) {
		ieach(data.objs, function(i, d) {
			var obj = _t.remotes[d.id]
			if (obj) {
				obj.finished = true
				delete _t.remotes[d.id]
			}
		})
	}

	_t.socket = null
	_t.connectToServer = function(url) {
		_t.socket = io.connect('/')
		_t.socket.on('sync+', _t.addSyncData)
		_t.socket.on('sync-', _t.removeSyncData)
		_t.socket.on('sync',  _t.loadSyncData)
	}

	_t.scene = new THREE.Scene()
	_t.initWorld = function(camera) {
		var floor = new THREE.Mesh(
			new THREE.PlaneGeometry(2000, 2000, 5, 5),
			new THREE.MeshBasicMaterial({ color:0x9db3b5, overdraw:true })
		)
		_t.scene.add(floor)
	}

	return _t
})(this.THREE || require('three'))

if (typeof module !== 'undefined')
	exports.game = GAME