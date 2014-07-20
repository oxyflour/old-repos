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
	var to = v.to,
		dx = to.x - v.x,
		dy = to.y - v.y,
		dz = to.z - v.z,
		ds = dx*dx + dy*dy + dz*dz
	f = f || 0.1
	d = d || 0.0001
	if (ds > f)
		v.set(v.x + dx*f, v.y + dy*f, v.z + dz*f)
	else
		v.to = null
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
			callback(list)
	}
	check()
}

function getReqsDict() {
	return ieach(location.search.substr(1).split('&'), function(i, s, d) {
		var st = s.split('=')
		d[st[0]] = st[1] || ''
	}, { })
}

function getImageData(img, sx, sy, sw, sh, w, h) {
	var cv = document.createElement('canvas')
		dc = cv.getContext('2d')
	sx = sx || 0
	sy = sy || 0
	sw = sw || img.width - sx
	sh = sh || img.height - sy
	cv.width  = w = w || sw
	cv.height = h = h || sh
	dc.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
	return cv
}

var THREE = this.THREE || require('three'),
	MD2CharacterComplex = THREE.MD2CharacterComplex || require('./MD2CharacterComplex.js')

var Resource = function(data) {
	function newImage(src) {
		var img = document.createElement('img')
		img.src = src
		img.style.display = 'none'
		document.body.appendChild(img)
		return img
	}
	function newMD2Char(conf) {
		var model = new MD2CharacterComplex()
		model.conf = conf
		model.scale = 3
		model.onLoadComplete = function() {
			this.complete = true
		}
		model.loadParts(conf)
		return model
	}
	this.World = newImage('textures/terrain/China.png')
	this.Grass = newImage('textures/terrain/grasslight-big.jpg')
	this.Player = newMD2Char({
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
		/*
		if (m.positionTo)
			m.positionTo = updateVector(p, m.positionTo, 0.05)
		if (m.rotationTo)
			m.rotationTo = updateVector(p, m.rotationTo, 0.05)
		*/
		if (p.to) updateVector(p)
		if (r.to) updateVector(r)
		// walk on terrain
		if (this.terrain) {
			this.terrain.check(p.x, p.z)
			var position = new THREE.Vector3(p.x, 10240, p.z)
				direction = new THREE.Vector3(0, -1, 0),
				raycast = new THREE.Raycaster(position, direction),
				intersect = raycast.intersectObject(this.terrain.current)
			this.terrainY = intersect.length ? intersect[0].point.y + this.initialY : p.y
			//	
			if (p.y < this.terrainY) {
				p.y = this.terrainY
				v.y = 0
			}
			else if (p.y > this.terrainY) {
				// add gravity
				v.y -= 0.015 * dt
			}
		}
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
			// restore skin color
			if (this.skin != data.skin)
				this.model.setSkin(this.skin = data.skin)
		}
		else return {
			skin: this.skin
		}
	}
	// run with control
	var run = proto.run
	proto.run = function(dt) {
		var ctrl = this.model.controls
		if (this.keys) {
			var ks = this.keys
			ctrl.moveForward  = ks.W || ks.UP
			ctrl.moveBackward = ks.S || ks.DOWN
			ctrl.moveLeft  = ks.A || ks.LEFT
			ctrl.moveRight = ks.D || ks.RIGHT
			ctrl.crouch = ks.ctrlKey
			ctrl.jump = ks.SPACE
		}
		//
		this.model.update(dt / 1000)
		//
		run.apply(this, arguments)
		//
		if (ctrl.jump && this.position.y == this.terrainY)
			this.velocity.y = 5
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
			data.model.enableShadows(true)
			if (!data.skin)
				data.skin = Math.floor(Math.random() * model.conf.skins.length)
			data.model.setSkin(data.skin)
			data.model.setWeapon(0)
			data.mesh = data.model.root
			// remember the initial y position (half of height)
			data.initialY = data.mesh.position.y
		}
		create.call(this, data)
	}, proto)
})(new Basic())

var Terrain = function(scene, heightMap, textureSrc) {
	var _t = this,
		texture = THREE.ImageUtils.loadTexture(textureSrc),
		// max height
		mh = 512,
		// ground size (in pixels)
		gw = 1024*2,
		gh = 1024*2,
		// ground points count
		pw = 32,
		ph = 32,
		// image clip (in pixels)
		iw = 32,
		ih = 32,
		// cached terrains
		cached = { }
	// current terrain
	_t.current = null
	_t.check = function(x, y) {
		var i = Math.floor(x / gw + 0.5),
			j = Math.floor(y / gh + 0.5),
			k = i + ',' + j
		if (_t.current !== cached[k]) {
			_t.change(i, j)
			_t.current = cached[k]
		}
	}
	_t.change = function(i, j) {
		//
		for (var k in cached)
			cached[k].visible = false
		//
		for (var m = i - 1; m <= i + 1; m ++) {
			for (var n = j - 1; n <= j + 1; n ++) {
				var k = m + ',' + n
				if (!cached[k])
					cached[k] = _t.create(m, n)
				cached[k].visible = true
			}
		}
	}
	_t.create = function(i, j) {
		var x = iw * i - iw / 2 + heightMap.width / 2,
			y = ih * j - ih / 2 + heightMap.height / 2,
			px = i * gw,
			py = j * gh
		// get height map
		var canvas = getImageData(heightMap, x, y, iw+1, ih+1, pw+1, ph+1),
			imdata = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
		//
		var geometry = new THREE.PlaneGeometry(gw, gh, pw, ph)
		geometry.dynamic = true
		if (geometry.vertices.length*4 == imdata.length) {
			ieach(geometry.vertices, function(i, v) {
				v.z = imdata[i * 4] / 255 * mh
			})
		}
		geometry.computeFaceNormals()
		geometry.computeVertexNormals()
		geometry.__dirtyVertices = true
		geometry.__dirtyNormals = true
		//
		var material = new THREE.MeshPhongMaterial({ color:0xffffff, map:texture })
		//var material = new THREE.MeshBasicMaterial({ color:[0xff0000, 0x00ff00][Math.abs(i + j) % 2] })
		//
		var ground = new THREE.Mesh(geometry, material)
		ground.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2))
		ground.applyMatrix(new THREE.Matrix4().setPosition(new THREE.Vector3(px, 0, py)))
		/*
		ground.material.map.repeat.set(64, 64)
		ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping
		ground.castShadow = true
		*/
		ground.receiveShadow = true
		console.log('ground ('+i+', '+j+') at ('+px+', '+py+') created')
		//
		scene.add(ground)
		return ground
	}
	return _t
}

var Client = function(url) {
	var _t = this

	var conf = getReqsDict()

	_t.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 4000)
	_t.camera.position.set(0, 150, -800)
	_t.camera.lookAt(new THREE.Vector3())

	_t.scene = new THREE.Scene()
	_t.scene.fog = new THREE.Fog(0xffffff, 1000, 4000)
	_t.scene.add(_t.camera)

	_t.scene.add(new THREE.AmbientLight(0x222222))

	var light = new THREE.DirectionalLight(0xffffff, 2.25)
	light.position.set(200, 450, 500)
	light.castShadow = conf.noshadow === undefined
	light.shadowMapWidth = 1024
	light.shadowMapHeight = 1024
	light.shadowMapDarkness = 0.95
	//light.shadowCameraVisible = true
	light.shadowCascade = conf.noshadow === undefined
	light.shadowCascadeCount = 3
	light.shadowCascadeNearZ  = [-1.000, 0.995, 0.998]
	light.shadowCascadeFarZ   = [ 0.995, 0.998, 1.000]
	light.shadowCascadeWidth  = [1024, 1024, 1024]
	light.shadowCascadeHeight = [1024, 1024, 1024]
	_t.scene.add(light)

	try {
		_t.renderer = new THREE.WebGLRenderer({ antialias:true })
	}
	catch (e) {
		_t.renderer = new THREE.CanvasRenderer()
		//
		_t.renderer.render = function() { }
	}
	_t.renderer.gammaInput = true
	_t.renderer.gammaOutput = true
	_t.renderer.shadowMapEnabled = true
	_t.renderer.shadowMapCascade = true
	_t.renderer.shadowMapType = THREE.PCFSoftShadowMap
	//_t.renderer.shadowMapDebug = true
	_t.renderer.setClearColor(_t.scene.fog.color, 1)
	document.body.appendChild(_t.renderer.domElement)

	_t.controls = new THREE.OrbitControls(_t.camera, _t.renderer.domElement)
	_t.controls.noKeys = true

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
			if (!_t.hosting) {
				_t.hosting = setInterval(function() {
					_t.socket.emit('sync', getSyncData())
				}, 200)
				$('body').append('<div '+
					'style="position:absolute;left:0;top:0;padding:5px;background:rgba(255,255,255,0.5)">'+
					'you are now hosting</div>')
			}
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
		data.terrain = _t.terrain
		//
		var obj = null
		if (data.cls == 'Player') {
			data.keys = _t.keys[data.sid] ||
				(_t.keys[data.sid] = { })
			data.modelBase = _t.resource.Player
			obj = new Player(data)
			if (obj.sid == _t.socket.io.engine.id)
				obj.mesh.add(_t.camera)
		}
		else {
			obj = new Basic(data)
		}
		//
		_t.objs.add(obj)
		return obj
	}

	checkComplete(new Resource(), function(res) {
		_t.resource = res
		_t.terrain = new Terrain(_t.scene, res.World, res.Grass.src)
		initInput()
		connectToServer(url, conf.nojoin === undefined)
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
