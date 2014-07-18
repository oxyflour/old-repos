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
		32: 'SPACE',
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

function updateVector(v, f, d) {
	var dx = v.to.x - v.x,
		dy = v.to.y - v.y,
		dz = v.to.z - v.z,
		ds = dx*dx + dy*dy + dz*dz
	f = f || 0.1
	d = d || 0.0001
	if (ds > f)
		v.set(v.x + dx*f, v.y + dy*f, v.z + dz*f)
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
			r = m.rotation,
			v = m.velocity
		p.add(v)
		// simple interplotation
		if (p.to) updateVector(p, 0.05)
		if (r.to) updateVector(r, 0.03)
	},
	quit: function() {
		this.scene && this.scene.remove(this.mesh)
		console.log('object #' + this.id + ' killed')
	},
	sync: function(data) {
	}
})

var Player = (function(proto) {
	proto.sync = function(data) {
		if (data) {
			this.model.bodyOrientation = this.model.bodyOrientation*0.9 + data.orientation*0.1
			if (this.skin != data.skin)
				this.model.setSkin(this.skin = data.skin)
		}
		else return {
			orientation: this.model.bodyOrientation,
			skin: this.skin
		}
	}
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
			ctrl.crouch = ks.ctrlKey
			ctrl.jump = ks.SPACE
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
			if (!data.skin)
				data.skin = Math.floor(Math.random() * model.conf.skins.length)
			data.model.setSkin(data.skin)
			data.model.setWeapon(0)
			data.mesh = data.model.root
		}
		create.call(this, data)
	}, proto)
})(new Basic())

var Client = function(url) {
	var _t = this

	_t.scene = new THREE.Scene()

	_t.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 10000)
	_t.camera.position.set(0, 100, -500)
	_t.camera.lookAt(new THREE.Vector3(0, 0, 0))

	_t.controls = new THREE.OrbitControls(_t.camera)
	_t.controls.noKeys = true

	function initWorld() {
		var ground = new THREE.Mesh(
			new THREE.PlaneGeometry(8000, 8000, 5, 5),
			new THREE.MeshPhongMaterial({
				color: 0xffffff,
				map: THREE.ImageUtils.loadTexture("textures/terrain/grasslight-big.jpg")
			})
		)
		ground.rotation.x = - Math.PI / 2
		ground.material.map.repeat.set(64, 64)
		ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping
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
	function getSyncData(objs, action) {
		var data = {
			action: action
		}
		data.objs = ieach(objs || _t.objs, function(i, obj, list) {
			if (!obj || obj.finished) return
			var mesh = obj.mesh
			list.push({
				data: obj.sync(),
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
	function syncObject(data) {
		var obj = _t.sobjs[data.id]
		if (obj) {
			obj.mesh.position.to = new THREE.Vector3().fromArray(data.position)
			obj.mesh.rotation.to = new THREE.Euler().fromArray(data.rotation)
			obj.mesh.velocity.fromArray(data.velocity)
		}
		else {
			obj = newObject(data)
			obj.mesh.position.fromArray(data.position)
			obj.mesh.rotation.fromArray(data.rotation)
			obj.mesh.velocity.fromArray(data.velocity)
			_t.sobjs[data.id] = obj
		}
		if (data.data)
			obj.sync(data.data)
		return obj
	}
	_t.hosting = false
	function connectToServer(url, join) {
		_t.socket = io.connect(url)
		//
		_t.socket.on('ping', function(data) {
			_t.socket.emit('ping')
		})
		_t.socket.on('host', function(clients) {
			// clear unused sessions
			_t.objs.forEach(function(obj) {
				if (obj && obj.sid)
					obj.finished = !clients[obj.sid]
			})
			// start hosting
			if (!_t.hosting) _t.hosting = setInterval(function() {
				_t.socket.emit('sync', getSyncData())
			}, 200)
		})
		_t.socket.on('join', function(sid) {
			newObject({
				cls: 'Player',
				sid: sid,
				id: Date.now()
			})
		})
		_t.socket.on('sync', function(data) {
			if (data.action == '+') {
				data.objs.forEach(syncObject)
			}
			else if (data.action == '-') {
				data.objs.forEach(function(d) {
					var obj = _t.sobjs[d.id]
					if (obj) {
						obj.finished = true
						delete _t.sobjs[d.id]
					}
				})
			}
			else {
				keach(_t.sobjs, function(id, obj) {
					obj.finished = true
				})
				_t.sobjs = ieach(data.objs, function(i, d, objs) {
					var obj = syncObject(d)
					obj.finished = false
					objs[obj.id] = obj
				}, { })
			}
		})
		_t.socket.on('input', function(data) {
			data.forEach(function(e) {
				_t.inputs.push(e)
			})
		})

		if (join)
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
		if (obj.sid == _t.socket.io.engine.id) {
			obj.mesh.add(_t.camera)
		}
		//
		_t.objs.add(obj)
		return obj
	}

	var res = new Resource()
	checkComplete(res, function() {
		initWorld()
		initInput()
		connectToServer(url, location.search != '?watch')
	})

	return _t
}

var Server = function(io) {
	var _t = this

	function getClients() {
		return keach(clients, function(k, s, d) {
			d[k] = true
		}, { })
	}

	var host = null,
		clients = { }
	function setAsHost(socket) {
		host = socket
		socket.emit('host', getClients())
		console.log('client ' + socket.id + ' is now hosting')
	}
	function pingForHost(socket) {
		host = null
		socket.broadcast.emit('ping')
		console.log('waiting for a new host...')
	}
	io.on('connection', function(socket) {
		var sid = socket.id
		clients[sid] = socket
		console.log('client ' + sid + ' connected')
		if (!host) setAsHost(socket)

		socket.on('ping', function(data) {
			if (!host)
				setAsHost(socket)
		})

		socket.on('sync', function(data) {
			if (host === socket)
				socket.broadcast.emit('sync', data)
		})

		socket.on('join', function() {
			if (host)
				host.emit('join', sid)
		})

		socket.on('input', function(data) {
			socket.broadcast.emit('input', data)
		})

		socket.on('disconnect', function() {
			delete clients[sid]
			console.log('client ' + sid + ' disconnected')

			if (host === socket)
				pingForHost(socket)
			else if (host)
				host.emit('host', getClients())
		})
	})
}

if (typeof module !== 'undefined') {
	exports.Client = Client
	exports.Server = Server
}
