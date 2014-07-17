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

function updateKeyState(ks, e) {
	ks.shiftKey = e.shiftKey
	ks.ctrlKey = e.ctrlKey
	// translate key code to char
	var c = {
		37: 'LEFT',
		38: 'UP',
		39: 'RIGHT',
		40: 'DOWN',
	}[e.which] || String.fromCharCode(e.which) || c
	// update key state
	if (e.type == 'keydown')
		ks[c] = 1
	else if (e.type == 'keyup')
		ks[c] = 0
}

function newClass(create, proto) {
	proto.create = create
	create.prototype = proto
	return create
}

function updateVector(v) {
	var d = v.to.clone().sub(v)
	if (d.length() > 1)
		v.add(d.multiplyScalar(0.2))
	else
		v.to = undefined
}

function checkComplete(list, callback) {
	function check() {
		var total = 0,
			complete = 0
		for (var k in list) {
			var r = list[k]
			total ++
			complete += r.complete ? 1 : 0
		}
		var process = complete / total

		if (process < 1)
			setTimeout(check, 200)
		else
			callback()
	}
	check()
}

var THREE = this.THREE || require('three'),
	MD2CharacterComplex = THREE.MD2CharacterComplex || require('./MD2CharacterComplex.js')

var Resource = function(data) {
	this.Player = (function(conf) {
		var model = new MD2CharacterComplex()
		model.conf = conf
		model.scale = 3
		model.onLoadComplete = function() {
			this.complete = true
		}
		model.loadParts(conf)
		return model
	})({
		no_load: data && data.no_load,
		baseUrl: 'models/ogro/',
		body: 'ogro-light.js',
		skins: ('grok.jpg|ogrobase.png|arboshak.png|ctf_r.png|ctf_b.png|darkam.png|'+
			'freedom.png|gordogh.png|igdosh.png|khorne.png|nabogro.png|sharokh.png').split('|'),
		weapons: [ 'weapon-light.js|weapon.jpg'.split('|') ],
		animations: {
			move: "run",
			idle: "stand",
			jump: "jump",
			attack: "attack",
			crouchMove: "cwalk",
			crouchIdle: "cstand",
			crouchAttach: "crattack"
		},
		walkSpeed: 350,
		crouchSpeed: 175
	})
}

var Basic = (function(proto) {
	return newClass(function(data) {
		// extend data into object
		extend(this, data)
		// create a cube
		if (!this.mesh) this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(200, 200, 200),
			new THREE.MeshBasicMaterial({ color:'white', wireframe: true, })
		)
	}, proto)
})({
	init: function() {
		// add velocity
		this.mesh.velocity = new THREE.Vector3()
		this.scene && this.scene.add(this.mesh)
		console.log('object #' + this.id + ' created')
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
		this.scene && this.scene.remove(this.mesh)
		console.log('object #' + this.id + ' killed')
	}
})

var Player = (function(proto) {
	// run with control
	var run = proto.run
	proto.run = function(dt) {
		if (this.keys) {
			var ks = this.keys,
				ctrl = this.model.controls
			ctrl.moveForward  = ks.W || ks.UP
			ctrl.moveBackward = ks.S || ks.DOWN
			ctrl.moveLeft  = ks.A || ks.LEFT
			ctrl.moveRight = ks.D || ks.RIGHT
		}
		this.model.update(dt / 1000)
		run.apply(this, arguments)
	}
	// cerate model
	var create = proto.create
	return newClass(function(data) {
		//
		data.model = new MD2CharacterComplex()
		data.model.controls = { }
		//
		if (data.modelBase) {
			var model = data.modelBase
			data.model.scale = model.scale
			data.model.shareParts(model)
			data.model.setSkin(0)
			data.model.setWeapon(0)
			data.mesh = data.model.root
		}
		create.call(this, data)
	}, proto)
})(new Basic())

var Client = function(url) {
	var _t = this

	_t.scene = new THREE.Scene()
	function initWorld() {
		var ground = new THREE.Mesh(
			new THREE.PlaneGeometry(2000, 2000, 5, 5),
			new THREE.MeshBasicMaterial({ color:0x9db3b5, overdraw:true })
		)
		ground.rotation.x = - Math.PI / 2
		ground.position.y = -72
		ground.receiveShadow = true
		_t.scene.add(ground)

		_t.scene.fog = new THREE.Fog(0xffffff, 1000, 4000)

		_t.scene.add(new THREE.AmbientLight(0x222222))

		var light = new THREE.DirectionalLight(0xffffff, 2.25)
		light.position.set(200, 450, 500)
		light.castShadow = true
		light.shadowMapWidth = 1024
		light.shadowMapHeight = 1024
		light.shadowMapDarkness = 0.95
		//light.shadowCameraVisible = true
		light.shadowCascade = true
		light.shadowCascadeCount = 3
		light.shadowCascadeNearZ = [-1.000, 0.995, 0.998]
		light.shadowCascadeFarZ  = [0.995, 0.998, 1.000]
		light.shadowCascadeWidth = [1024, 1024, 1024]
		light.shadowCascadeHeight = [1024, 1024, 1024]
		_t.scene.add(light)
	}

	_t.socket = null
	_t.sobjs = { }
	function syncObject(data) {
		var obj = _t.sobjs[data.id]
		if (obj) {
			obj.mesh.position.to = new THREE.Vector3().fromArray(data.position)
			obj.mesh.rotation.fromArray(data.rotation)
			obj.mesh.velocity.fromArray(data.velocity)
		}
		else {
			obj = newObject(data)
			obj.mesh.position.fromArray(data.position)
			obj.mesh.rotation.fromArray(data.rotation)
			obj.mesh.velocity.fromArray(data.velocity)
			_t.sobjs[data.id] = obj
		}
		return obj
	}
	function connectToServer(url) {
		_t.socket = io.connect(url)
		//
		_t.socket.on('sync+', function(data) {
			data.objs.forEach(syncObject)
		})
		_t.socket.on('sync-', function(data) {
			data.objs.forEach(function(d) {
				var obj = _t.sobjs[d.id]
				if (obj) {
					obj.finished = true
					delete _t.sobjs[d.id]
				}
			})
		})
		_t.socket.on('sync', function(data) {
			keach(_t.sobjs, function(id, obj) {
				obj.finished = true
			})
			_t.sobjs = ieach(data.objs, function(i, d, objs) {
				var obj = syncObject(d)
				obj.finished = false
				objs[obj.id] = obj
			}, { })
		})
		//
		_t.socket.on('input', function(data) {
			data.forEach(function(e) {
				_t.inputs.push(e)
			})
		})
		// join now!
		_t.socket.emit('join')
	}

	_t.inputs = [ ]
	function initInput() {
		$(window).bind('keydown keyup', function(e) {
			_t.inputs.push({
				type: e.type,
				which: e.which,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey
			})
		})
	}

	_t.keys = { }
	_t.objs = newAnimateList()
	_t.run = function(dt) {
		if (_t.inputs.length) {
			var localInputs = []
			_t.inputs.forEach(function(e) {
				if (!e.sid) {
					e.sid = _t.socket.io.engine.id
					localInputs.push(e)
				}
				var ws = _t.keys[e.sid]
				ws && updateKeyState(ws, e)
			})
			if (localInputs.length)
				_t.socket.emit('input', localInputs)
			_t.inputs.length = 0
		}
		_t.objs.run(dt)
	}

	function newObject(data) {
		//
		data.scene = _t.scene
		//
		var obj = null
		if (data.cls == 'Player') {
			data.keys = _t.keys[data.sid] ||
				(_t.keys[data.sid] = { })
			data.modelBase = res.Player
			obj = new Player(data)
		}
		else {
			obj = new Basic(data)
		}
		//
		_t.objs.add(obj)
		return obj
	}

	initWorld()
	var res = new Resource()
	checkComplete(res, function() {
		initInput()
		connectToServer(url)
	})

	return _t
}

var Server = function(io) {
	var _t = this

	_t.clients = { }
	_t.keys = { }
	_t.inputs = [ ]
	function getSyncData(objs) {
		var data = { }
		data.objs = ieach(objs || _t.objs, function(i, obj, list) {
			if (!obj) return
			var mesh = obj.mesh
			list.push({
				cls: obj.cls,
				id: obj.id,
				sid: obj.sid,
				position: mesh.position.toArray(),
				rotation: mesh.rotation.toArray(),
				velocity: mesh.velocity.toArray(),
			})
		}, [])
		return data
	}
	function beginServer(io) {
		io.on('connection', function(socket) {
			var sid = socket.id
			_t.clients[sid] = socket
			console.log('client ' + sid + ' connected')

			var obj = null
			socket.on('join', function() {
				if (!obj) {
					obj = newObject({ cls:'Player', sid:sid })
					socket.emit('sync', getSyncData())
					socket.broadcast.emit('sync+', getSyncData([obj]))
				}
			})

			socket.on('input', function(data) {
				data.forEach(function(e) {
					_t.inputs.push(e)
				})
				socket.broadcast.emit('input', data)
			})

			setInterval(function() {
				socket.emit('sync', getSyncData())
			}, 500)

			socket.on('disconnect', function() {
				if (obj) {
					obj.finished = true
					socket.broadcast.emit('sync-', getSyncData([obj]))
					obj = null
				}
				delete _t.clients[sid]
				console.log('client ' + sid + ' disconnected')
			})
		})
	}

	_t.objs = newAnimateList()
	_t.run = function(dt) {
		if (_t.inputs.length) {
			_t.inputs.forEach(function(e) {
				var ws = _t.keys[e.sid]
				ws && updateKeyState(ws, e)
			})
			_t.inputs.length = 0
		}
		_t.objs.run(dt)
	}

	function newObject(data) {
		data.id = newObject.id = (newObject.id || 0) + 1
		//
		var obj = null
		if (data.cls == 'Player') {
			data.keys = _t.keys[data.sid] ||
				(_t.keys[data.sid] = { })
			obj = new Player(data)
		}
		else {
			obj = new Basic(data)
		}
		_t.objs.add(obj)
		return obj
	}

	var res = new Resource({ no_load:true })
	checkComplete(res, function() {
		beginServer(io)
	})

	return _t
}

if (typeof module !== 'undefined') {
	exports.Client = Client
	exports.Server = Server
}
