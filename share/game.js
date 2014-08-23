function guid() {
	// see http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	})
}
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
function keys(data) {
	return keach(data, function(k, v, d) {
		d.push(k)
	}, [ ])
}
function extend(data, ext) {
	return keach(ext, function(k, v, d) {
		d[k] = v
	}, data)
}

function slerp(from, to, factor) {
	return from * (1 - factor) + to * factor
}

function aValue() {
	for (var i = 0; i < arguments.length; i += 2)
		if (arguments[i]) return arguments[i + 1]
}
function aSet(d) {
	for (var i = 1; i < arguments.length; i += 2)
		d[arguments[i]] = arguments[i+1]
	return d
}

function newClass(create, proto) {
	proto.create = create
	create.prototype = proto
	return create
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
	_t.run = function(fn, dt) {
		running = true
		for (var i = 0, n = _t.length, t = null; i < n; i ++) {
			if (t = _t[i]) {
				if (t.finished) {
					t.quit && t.quit()
					_t[i] = undefined
					unused.push(i)
				}
				else if (!t.disabled && t[fn])
					t[fn](dt)
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

function updateVector(v, fx, fy, fz, d) {
	var to = v.to,
		dx = to.x - v.x,
		dy = to.y - v.y,
		dz = to.z - v.z
	if (dx*dx*fx + dy*dy*fy + dz*dz*fz > d)
		v.set(v.x + dx*fx, v.y + dy*fy, v.z + dz*fz)
	else
		v.to = null
}

function getReqsDict() {
	return ieach(location.search.substr(1).split('&'), function(i, s, d) {
		var st = s.split('=')
		d[st[0]] = st[1] || ''
	}, { })
}

function newCanvas(img, sx, sy, sw, sh, w, h) {
	var cv = document.createElement('canvas')
		dc = cv.getContext('2d')
	sx = sx || 0
	sy = sy || 0
	sw = sw || img.width - sx
	sh = sh || img.height - sy
	cv.width  = w = w || sw
	cv.height = h = h || sh
	if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && w > 0 && h > 0)
		dc.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
	return cv
}

function newRepeatImage(img) {
	var cv = document.createElement('canvas'),
		dc = cv.getContext('2d')
	cv.width = img.width * 2
	cv.height = img.height * 2
	dc.drawImage(img, 0, 0)
	dc.scale(-1, 1)
	dc.drawImage(img, -cv.width, 0)
	dc.scale(1, -1)
	dc.drawImage(img, -cv.width, -cv.height)
	dc.scale(-1, 1)
	dc.drawImage(img, 0, -cv.height)
	return cv
}

function newWrapTexture(img) {
	var texture = null
	if (typeof(img) == 'string') {
		texture = THREE.ImageUtils.loadTexture(img)
	}
	else {
		texture = new THREE.Texture(img, THREE.Texture.UVMapping)
		texture.needsUpdate = true
	}
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping
	return texture
}

var THREE = this.THREE || require('three'),
	MD2CharacterComplex = THREE.MD2CharacterComplex || require('./MD2CharacterComplex.js')

var ResLoader = function(url, handle, callback) {
	var cached = ResLoader.cached || (ResLoader.cached = { })

	function loaded(data) {
		// Note: this function might be called more than once
		// thus we have to check before save data to cache
		if (!cached[url])
			cached[url] = data
		callback(cached[url])
	}

	if (cached[url])
		loaded(cached[url])
	else 
		handle(url, loaded)
}
ResLoader.handleImg = function(url, callback) {
	var img = document.createElement('img')
	img.src = url
	function check() {
		if (img.complete)
			callback(img)
		else
			setTimeout(check, 200)
	}
	check()
}
ResLoader.handleText = function(url, callback) {
	$.get(url, callback).error(callback)
}
ResLoader.handleJSON = function(url, callback) {
	$.get(url, callback, 'json').error(callback)
}
ResLoader.handleMd2Char = function(url, callback) {
	var model = new MD2CharacterComplex()
	model.conf = {
		baseUrl: url,
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
	}
	model.scale = 3
	model.onLoadComplete = function() {
		callback(model)
	}
	model.loadParts(model.conf)
}
ResLoader.handleW3Char = function(url, callback) {
	THREE.LoadWar3Mdl(url, function(geometries) {
		geometries.forEach(function(geo) {
			// update texture path
			geo.extra.TexturePath = geo.extra.TexturePath &&
				'models/mdl/' + geo.extra.TexturePath.split('\\').pop().replace(/\.\w+$/g, '.png')
		})
		callback(geometries)
	})
}
var ResLoaderBatch = function(list, callback) {
	var data = [ ],
		left = list.length
	list.forEach(function(req, idx) {
		new ResLoader(req.url, req.handle, function(res) {
			data[idx] = res
			if (req.callback)
				req.callback(res)
			if (-- left == 0)
				callback.apply(null, data)
		})
	})
}

var LodTerrain = function(scene, img) {
	var _t = this,
		meshGrid = 128,
		meshCascade = [ 1024*3, 2048, 2048 ]

	var meshWidth = meshCascade[0] * 2,
		maxGrid = meshGrid
	var geometry = new THREE.PlaneGeometry(meshWidth, meshWidth, meshWidth / maxGrid, meshWidth / maxGrid)
	geometry.dynamic = true
	for (var i = 1; i < meshCascade.length; i ++) {
		var padding = meshCascade[i],
			halfWidth = meshWidth / 2
		//
		maxGrid *= 2
		geometry.vertices.forEach(function(v, i) {
			if (v.x == halfWidth && v.y % maxGrid)
				v.y -= maxGrid / 2
			else if (v.x == -halfWidth && v.y % maxGrid)
				v.y += maxGrid / 2
			else if (v.y == halfWidth && v.x % maxGrid)
				v.x -= maxGrid / 2
			else if (v.y == -halfWidth && v.x % maxGrid)
				v.x += maxGrid / 2
		})
		//
		geometry.merge(new THREE.PlaneGeometry(meshWidth + padding, padding, (meshWidth + padding) / maxGrid, padding / maxGrid),
			new THREE.Matrix4().makeTranslation(padding / 2, (meshWidth + padding) / 2, 0))
		geometry.merge(new THREE.PlaneGeometry(padding, meshWidth + padding, padding / maxGrid, (meshWidth + padding) / maxGrid),
			new THREE.Matrix4().makeTranslation((meshWidth + padding) / 2, -padding / 2, 0))
		geometry.merge(new THREE.PlaneGeometry(meshWidth + padding, padding, (meshWidth + padding) / maxGrid, padding / maxGrid),
			new THREE.Matrix4().makeTranslation(-padding / 2, -(meshWidth + padding) / 2, 0))
		geometry.merge(new THREE.PlaneGeometry(padding, meshWidth + padding, padding / maxGrid, (meshWidth + padding) / maxGrid),
			new THREE.Matrix4().makeTranslation(-(meshWidth + padding) / 2, padding / 2, 0))
		meshWidth += padding * 2
	}
	geometry.mergeVertices()

	var maxHeight = img.maxHeight || 2048,
		heightGrid = meshGrid,
		heightPosGrid = meshCascade[0] * 2 / 3

	// Note: make sure most of the height map pixels are on the mesh grid
	geometry.applyMatrix(new THREE.Matrix4().makeTranslation(heightGrid / 2, heightGrid / 2, 0))

	var heightMap = newCanvas(img),
		heightMapDC = heightMap.getContext('2d'),
		heightData = heightMapDC.getImageData(0, 0, heightMap.width, heightMap.height)
		imdata = heightData.data
	// in this new map, a is height and r, g, b are nomals
	for (var i = 0; i < imdata.length; i += 4) {
		imdata[i + 3] = imdata[i]
	}
	for (var i = 0; i < imdata.length; i += 4) {
		// compute vertex normal from r
		var h = imdata[i + 3],
			u = imdata[i + 4 + 3],
			v = imdata[i + heightMap.width * 4 + 3]
		if (u >= 0 && v >= 0) {
			var v = new THREE.Vector3((u - h)/255*maxHeight, (v - h)/255*maxHeight, heightGrid).normalize()
			imdata[i    ] = (v.x * 0.5 + 0.5) * 255
			imdata[i + 1] = (v.y * 0.5 + 0.5) * 255
			imdata[i + 2] = (v.z * 0.5 + 0.5) * 255
		}
	}
	heightMapDC.putImageData(heightData, 0, 0)

	var getHeightMap = (function() {
		var cv = document.createElement('canvas'),
			dc = cv.getContext('2d')
		cv.width = cv.height = Math.floor(meshWidth / heightGrid)
		return function(x, y) {
			var ix = Math.floor(x / heightGrid),
				iy = Math.floor(y / heightGrid),
				sx = -cv.width /2 + heightMap.width /2 + ix,
				sy = -cv.height/2 + heightMap.height/2 - iy
			dc.clearRect(0, 0, cv.width, cv.height)
			dc.drawImage(heightMap, sx, sy, cv.width, cv.height, 0, 0, cv.width, cv.height)
			return cv
		}
	})()

	var material = (function() {
		var shader = THREE.ShaderLib.TextureSplattingShader,
			uniforms = THREE.UniformsUtils.clone(shader.uniforms)
		uniforms.heightMapScale.value = maxHeight
		uniforms.heightMapSize.value = meshWidth
		uniforms.heightMap.value = newWrapTexture(getHeightMap(0, 0))
		uniforms.oceanTexture.value = newWrapTexture('textures/splatting/dirt-512.jpg')
		uniforms.sandyTexture.value = newWrapTexture('textures/splatting/sand-512.jpg')
		uniforms.grassTexture.value = newWrapTexture('textures/splatting/grass-512.jpg')
		uniforms.rockyTexture.value = newWrapTexture('textures/splatting/rock-512.jpg')
		uniforms.snowyTexture.value = newWrapTexture('textures/splatting/snow-512.jpg')
		return new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			lights: true,
			fog: true,
			//wireframe: true,
		})
	})()
	var depthMat = (function() {
		var shader = THREE.ShaderLib.TextureSplattingDepth,
			uniforms = THREE.UniformsUtils.clone(material.uniforms)
		return new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
		})
	})()

	// plane mesh
	this.mesh = new THREE.Mesh(geometry, material)
	this.mesh.receiveShadow = true
	this.mesh.castShadow = true
	this.mesh.customDepthMaterial = depthMat
	scene.add(this.mesh)

	// this.root is used for hit test
	this.root = new THREE.Object3D()
	scene.add(this.root)

	var raycast = new THREE.Raycaster(),
		dirDown = new THREE.Vector3(0, 0, -1)
	this.getHeight = function(x, y, z) {
		var origin = new THREE.Vector3(x, y, z || maxHeight + 1)
		raycast.set(origin, dirDown)
		// check intersection
		var intersect = raycast.intersectObjects(this.root.children, true)
		if (intersect.length)
			return intersect[0].point.z
		else
			return this.getHeightFromMap(x, y)
	}
	this.getHeightFromMap = function(x, y) {
		// Note: take care of the pixel offset
		var ix = Math.floor(x / heightGrid + 0.5),
			iy = Math.floor(y / heightGrid + 0.5),
			fx = x / heightGrid + 0.5 - ix,
			fy = y / heightGrid + 0.5 - iy,
			imdata = heightMapDC.getImageData(ix + heightMap.width / 2 - 1, heightMap.height / 2 - iy - 1, 2, 2).data
		// bilinear interplotation
		var lt = imdata[8 + 3], rt = imdata[12 + 3],
			lb = imdata[0 + 3], rb = imdata[4  + 3]
		return slerp(slerp(lt, rt, fx), slerp(lb, rb, fx), fy) / 255 * maxHeight
	}

	this.checkVisible = function(x, y) {
		var p = this.mesh.position,
			px = Math.floor(x / heightPosGrid + 0.5) * heightPosGrid,
			py = Math.floor(y / heightPosGrid + 0.5) * heightPosGrid
		if (p.x != px || p.y != py) {
			//
			getHeightMap(px, py)
			this.mesh.material.uniforms.heightMap.value.needsUpdate = true
			//
			this.root.children.forEach(function(obj) {
				obj.visible = _t.isVisible(obj.position.x, obj.position.y)
			})
			p.x = px
			p.y = py
		}
	}

	this.isVisible = function(x, y) {
		var p = this.mesh.position,
			h = meshWidth / 2
		return x > p.x - h && x < p.x + h &&
			y > p.y - h && y < p.y + h
	}

	this.addMesh = function(mesh) {
		var b = new THREE.BoundingBoxHelper(mesh)
		b.update()
		var p = mesh.position
		p.z += _t.getHeight(p.x, p.y) - b.box.min.z
		this.root.add(mesh)
	}
}

var Static = (function(proto) {
	proto.box = null
	//
	return newClass(function(data) {
		// extend data into object
		extend(this, data)
		// create a cube
		if (!this.mesh) this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(200, 200, 200),
			new THREE.MeshBasicMaterial({ color:'white', })
		)
		if (this.at) {
			var pos = this.at.split(',').map(parseFloat)
			this.mesh.position.x = pos[0]
			this.mesh.position.y = pos[1]
		}
		if (this.terrain) {
			// get terrain base
			if (!this.box) {
				var m = this.mesh
					b = new THREE.BoundingBoxHelper(m)
				b.update()
				this.box = {
					toTop: b.box.max.z -  m.position.z,
					toBottom: m.position.z - b.box.min.z,
					height: b.box.max.z - b.box.min.z,
				}
			}
			// put it on the terrain
			var p = this.mesh.position
			p.z = this.terrain.getHeight(p.x, p.y) + this.box.toBottom
		}
		// simply call this.onready
		this.onready && this.onready()
	}, proto)
})({
	init: function() {
		this.scene && this.scene.add(this.mesh)
		console.log('object #' + this.id + ' created')
	},
	quit: function() {
		this.scene && this.scene.remove(this.mesh)
		console.log('object #' + this.id + ' killed')
	},
	sync: function(data) {
		// sync position & rotation
		var mesh = this.mesh
		if (data) {
			mesh.position.fromArray(data.position)
			mesh.rotation.fromArray(data.rotation)
		}
		else return {
			position: mesh.position.toArray(),
			rotation: mesh.rotation.toArray(),
		}
	},
	render: function(dt) {
		if (this.terrain) {
			var p = this.mesh.position
			this.mesh.visible = this.terrain.isVisible(p.x, p.y)
		}
	}
})

var Basic = (function(proto) {
	//
	proto.terrainUpdateInterval = 100
	proto.dataSyncInterval = 2000
	//
	proto.controls = null
	proto.gravity = 0.0012
	proto.canFly = false
	proto.speed = 0
	proto.angularSpeed = 0
	proto.verticalSpeed = 0
	proto.moveConfig = {
		speed: 0.3,
		fastSpeed: 0.6,
		angularSpeed: 0.003,
		rotateSpeed: 0.1,
		jumpSpeed: 6,
		// for flying objects
		shiftSpeed: 0.2,
		// animation speed
		walkAnimSpeed: 0.8,
	}
	//
	proto.run = function(dt) {
		// move!
		var m = this.mesh,
			p = m.position,
			r = m.rotation

		// simple interplotation
		if (p.to) updateVector(p, 0.05, 0.05, this.verticalSpeed ? 0.00 : 0.05, 0.00001)
		if (r.to) updateVector(r, 0.03, 0.03, 0.03, 0.00001)
		if (this.verticalSpeed) p.z += this.verticalSpeed * dt

		//
		if (this.controls) {
			var ctrl = this.controls,
				conf = this.moveConfig,
				mesh = this.mesh

			if (ctrl.moveForward) {
				if (!this.moving && (this.moving = true)) {
					var tick = Date.now()
					if (tick - ctrl.moveForwardTick < 500)
						this.movingFast = true
					ctrl.moveForwardTick = tick
				}
			}
			else {
				this.moving = this.movingFast = false
			}

			var speed = 0
			if (ctrl.moveLeft || ctrl.moveRight)
				speed = this.speed > 0 ? conf.rotateSpeed : -conf.rotateSpeed
			else if (ctrl.moveForward)
				speed = this.movingFast ? conf.fastSpeed : conf.speed
			else if (ctrl.moveBackward)
				speed = -conf.speed
			if (this.speed = slerp(this.speed, speed, 0.06))
				mesh.translateX(this.speed * dt)

			var aspeed = 0
			if (ctrl.moveLeft)
				aspeed = conf.angularSpeed
			else if (ctrl.moveRight)
				aspeed = -conf.angularSpeed
			if (this.angularSpeed = slerp(this.angularSpeed, aspeed, 0.1))
				mesh.rotation.z += this.angularSpeed * dt

			var zspeed = this.canFly ? 0 : this.verticalSpeed
			if (ctrl.jump && this.canFly)
				zspeed = conf.shiftSpeed
			else if (ctrl.jump && p.z <= this.terrainZ && zspeed <= 0)
				zspeed = conf.jumpSpeed
			else if (ctrl.crouch && p.z > this.terrainZ)
				zspeed = -conf.shiftSpeed
			if (this.verticalSpeed !== zspeed)
				this.verticalSpeed = slerp(this.verticalSpeed, zspeed, 0.1)
		}

		// walk on terrain
		if (this.terrain) {

			// test terrain height
			if (!((this.terrainUpdateTick += dt) < this.terrainUpdateInterval)) {
				this.terrainUpdateTick = 0
				this.terrainZ = this.terrain.getHeight(p.x, p.y, p.z + this.box.toTop) + this.box.toBottom
			}

			// keep object on the ground
			if (p.z < this.terrainZ || (this.canFly && this.verticalSpeed <= 0 && p.z - this.terrainZ < 5)) {
				if (this.terrainZ - p.z < 0.05) {
					p.z = this.terrainZ
					this.verticalSpeed = 0
				}
				else {
					p.z = slerp(p.z, this.terrainZ, this.canFly ? 0.05 : 0.1)
					if (this.verticalSpeed < 0)
						this.verticalSpeed *= 0.6
				}
			}
			// add gravity if object is over the ground
			else if (p.z > this.terrainZ && !this.canFly) {
				this.verticalSpeed -= this.gravity * dt
			}
		}

		//
		if (this.syncs) {
			if (!((this.dataSyncTick += dt) < this.dataSyncInterval)) {
				this.dataSyncTick = 0
				this.syncs.push(this)
			}
		}
	}
	var sync = proto.sync
	proto.sync = function(data) {
		if (data) {
			var mesh = this.mesh
			if (this.synced) {
				mesh.position.to = new THREE.Vector3().fromArray(data.position)
				mesh.rotation.to = new THREE.Euler().fromArray(data.rotation)
			}
			else {
				mesh.position.fromArray(data.position)
				mesh.rotation.fromArray(data.rotation)
				this.synced = true
			}
		}
		else
			return sync.call(this)
	}
	var create = proto.create
	return newClass(function(data) {
		create.call(this, data)
		//
		if (this.moveConfig !== proto.moveConfig)
			this.moveConfig = extend(extend({ }, proto.moveConfig), this.moveConfig)
	}, proto)
})(new Static())

/*
var Player = (function(proto) {
	proto.dataSyncInterval = 200
	// sync model skin
	var sync = proto.sync
	proto.sync = function(data) {
		if (data) {
			sync.call(this, data)
			// restore skin color
			if (this.skin != data.skin)
				this.model.setSkin(this.skin = data.skin)
		}
		else {
			data = sync.call(this)
			data.skin = this.skin
			return data
		}
	}
	// run with controls
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
		run.call(this, dt)
	}
	// cerate model
	var create = proto.create
	return newClass(function(data) {
		this.model = new MD2CharacterComplex()
		this.model.controls = { }
		var _t = this
		new ResLoader('models/ogro/', ResLoader.handleMd2Char, function(model) {
			_t.model.scale = model.scale
			_t.model.shareParts(model)
			_t.model.enableShadows(true)
			_t.model.setWeapon(0)
			_t.mesh = _t.model.root
			//
			create.call(_t, data)
			//
			_t.skin = Math.floor(Math.random() * model.conf.skins.length)
			_t.model.setSkin(_t.skin)
		})
	}, proto)
})(new Basic())
*/

var W3Player = (function(proto) {
	proto.dataSyncInterval = 200
	// sync model skin
	var sync = proto.sync
	proto.sync = function(data) {
		if (data)
			sync.call(this, data)
		else
			return aSet(sync.call(this), 'name', this.name)
	}
	//
	var run = proto.run
	proto.run = function(dt) {
		if (this.keys) {
			var ks = this.keys,
				ctrl = this.controls
			ctrl.moveForward  = ks.W || ks.UP
			ctrl.moveBackward = ks.S || ks.DOWN
			ctrl.moveLeft  = ks.A || ks.LEFT
			ctrl.moveRight = ks.D || ks.RIGHT
			ctrl.crouch = ks.shiftKey
			ctrl.jump = ks.SPACE || ks.X
			ctrl.attack = ks.Z
			ctrl.spell = ks.C
		}
		//
		run.call(this, dt)
	}
	var render = proto.render
	proto.render = function(dt) {
		this.model.beforeRender(dt)
		//
		var ctrl = this.controls
		if (ctrl.spell && this.anims.spell.length)
			this.model.playAnimation(this.anims.spell)
		else if (ctrl.attack)
			this.model.playAnimation(this.anims.attack)
		else if (this.speed > 0.05)
			this.model.playAnimation(this.movingFast && this.anims.run || this.anims.walk,
				 1 + this.speed * this.moveConfig.walkAnimSpeed)
		else if (this.speed < -0.05)
			this.model.playAnimation(this.anims.walk.pop ? this.anims.walk[0] : this.anims.walk,
				-1 + this.speed * this.moveConfig.walkAnimSpeed)
		else
			this.model.playAnimation(this.anims.stand)
		//
		render.call(this, dt)
	}
	function parseAnimGroup(animations) {
		var animGroup = {
			walk: [ ],
			attack: [ ],
			spell: [ ],
			stand: [ ],
		}
		for (var i = 0, a; a = animations[i]; i ++) {
			var name = a.name.toLowerCase(),
				list = null
			if (name.indexOf('walk') >= 0)
				list = animGroup.walk
			else if (name.indexOf('attack') >= 0)
				list = animGroup.attack
			else if (name.indexOf('spell') >= 0)
				list = animGroup.spell
			// don't want 'Stand Ready'
			else if (name.indexOf('stand') >= 0 && name.indexOf('ready') < 0)
				list = animGroup.stand
			if (list) {
				list.push(a.name)
				list[a.name] = i
			}
		}
		// use string instead of array if there is only one item
		var anims = { }
		for (var k in animGroup) {
			var a = animGroup[k]
			anims[k] = a.length ? a : a[0]
		}
		return anims
	}
	var create = proto.create
	return newClass(function(data) {
		var _t = this,
			url = 'models/mdl/'+(data.name || 'hakurei reimu')+'.txt'
		new ResLoader(url, ResLoader.handleW3Char, function(geometries) {
			//
			data.anims = geometries[0] ? parseAnimGroup(geometries[0].animations) : { }
			data.controls = { }
			//
			data.nameLower = (data.name || 'hakurei reimu').toLowerCase()
			data.canFly = 'aya,remilia,yuyuko'.split(',').indexOf(data.nameLower) >= 0
			if (data.nameLower == 'cirno') {
				data.anims.run = data.anims.walk[1]
				data.anims.walk = data.anims.walk[0]
			}
			else if (data.nameLower == 'hakurei reimu') {
				data.moveConfig = { walkAnimSpeed:4 }
			}
			//
			data.model = new THREE.W3Character(geometries)
			data.mesh = data.model.root
			data.mesh.children.forEach(function(mesh) {
				mesh.castShadow = true
				//mesh.receiveShadow = true
			})
			//
			create.call(_t, data)
		})
	}, proto)
})(new Basic())

var Client = function(url) {
	var _t = this

	var conf = getReqsDict()
	conf.viewDepth = conf.viewDepth || 8000

	_t.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, conf.viewDepth + 100)
	_t.camera.up.set(0, 0, 1)
	_t.camera.position.set(-800, 0, 300)
	_t.camera.lookAt(new THREE.Vector3())

	_t.scene = new THREE.Scene()
	_t.scene.fog = new THREE.Fog(0xffffff, conf.viewDepth / 2, conf.viewDepth)
	_t.scene.add(_t.camera)

	_t.scene.add(new THREE.AmbientLight(0x555555))

	_t.light = new THREE.DirectionalLight(0x777777, 2.25)
	_t.light.position.set(0, 2000, 3000)
	_t.light.castShadow = conf.noshadow === undefined
	_t.light.shadowMapWidth = 1024
	_t.light.shadowMapHeight = 1024
	_t.light.shadowMapDarkness = 0.95
	//_t.light.shadowCameraVisible = true
	_t.light.shadowCascade = conf.noshadow === undefined
	_t.light.shadowCascadeCount = 3
	_t.light.shadowCascadeNearZ  = [-1.000, 0.995, 0.998]
	_t.light.shadowCascadeFarZ   = [ 0.996, 0.998, 1.000]
	_t.light.shadowCascadeWidth  = [2048, 2048, 2048]
	_t.light.shadowCascadeHeight = [2048, 2048, 2048]
	_t.scene.add(_t.light)

	_t.sky = new THREE.Mesh(
		new THREE.SphereGeometry(conf.viewDepth, 16, 8),
		new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.Sky.uniforms),
			vertexShader: THREE.ShaderLib.Sky.vertexShader,
			fragmentShader: THREE.ShaderLib.Sky.fragmentShader,
			side: THREE.BackSide,
			fog: true,
		})
	)
	_t.sky.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI/2))
	_t.camera.add(new THREE.Gyroscope().add(_t.sky))

	try {
		_t.renderer = new THREE.WebGLRenderer({ antialias:true })
	}
	catch (e) {
		_t.renderer = new THREE.CanvasRenderer()
		//
		_t.renderer.render = function(scene, camera) {
			if (scene.autoUpdate === true) scene.updateMatrixWorld()
			if (camera.parent === undefined) camera.updateMatrixWorld()
		}
	}
	_t.renderer.gammaInput = true
	_t.renderer.gammaOutput = true
	_t.renderer.shadowMapEnabled = true
	_t.renderer.shadowMapCascade = true
	//_t.renderer.shadowMapType = THREE.PCFSoftShadowMap
	//_t.renderer.shadowMapDebug = true
	document.body.appendChild(_t.renderer.domElement)

	_t.stats = new Stats()
	aSet(_t.stats.domElement.style, 
		'position', 'absolute',
		'margin', '5px',
		'bottom', '0')
	document.body.appendChild(_t.stats.domElement)

	_t.controls = new THREE.OrbitControls(_t.camera, _t.renderer.domElement)
	_t.controls.noKeys = true

	// socket used to communicate with server
	_t.socket = null
	// if this client is hosting the game
	_t.hosting = false
	// input events will be pushed in this array, then emited to server
	_t.inputs = [ ]
	// objects can push themselves into this array, then their sync data will be emitted (if this client is hosting)
	_t.syncs = [ ]
	// objects array
	_t.objects = newAnimateList()
	// objects dictionary (obj.id as key)
	_t.objIndex = { }
	// local & remote key states (the dictionary key is sid)
	_t.keys = { }

	function getSyncData(objects) {
		var data = { }
		data.action = objects ? 'sync' : 'sync-all'
		data.objects = ieach(objects || _t.objects, function(i, obj, list) {
			if (!obj || !obj.id || obj.finished) return
			var data = obj.sync()
			data.cls = obj.cls
			data.id = obj.id
			data.sid = obj.sid
			list.push(data)
		}, [])
		return data
	}

	function syncObject(data) {
		var obj = getObject(data)
		if (obj.ready)
			obj.sync(data)
		return obj
	}

	function connectToServer(url, join) {
		_t.socket = io.connect(url)
		//
		_t.socket.on('ping', function(data) {
			_t.socket.emit('ping')
		})
		_t.socket.on('hosting', function(clients) {
			// clear disconnected objects
			_t.objects.forEach(function(obj) {
				if (obj && obj.sid)
					obj.finished = !clients[obj.sid]
			})
			// start hosting
			if (!_t.hosting) {
				_t.hosting = true
				setInterval(function() {
					_t.socket.emit('broadcast', getSyncData())
				}, 2000)
			}
			//
			$('.status').addClass('hosting')
			$('.clients-num').text(keys(clients).length)
		})
		_t.socket.on('request', function(data) {
			if (data.action == 'join') getObject({
				id: guid(),
				sid: data.sid,
				cls: 'W3Player',
				name: data.name,
				at: data.at,
			})
		})
		_t.socket.on('broadcast', function(data) {
			if (data.action == 'sync') {
				data.objects.forEach(syncObject)
			}
			else if (data.action == 'sync-all') {
				data.objects.forEach(function(data) {
					var obj = syncObject(data)
					obj.syncing = true
				})
				_t.objects.forEach(function(obj) {
					if (!obj) return
					if (obj.syncing)
						obj.syncing = false
					else
						obj.finished = true
				})
			}
		})
		_t.socket.on('input', function(data) {
			data.forEach(function(e) {
				_t.inputs.push(e)
			})
		})

		if (join) _t.socket.emit('request', {
			action: 'join',
			name: conf.name,
			at: conf.at
		})
	}

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

	function getObject(data) {
		// make sure that id is unique
		var obj = _t.objIndex[data.id]
		if (obj && !obj.finished)
			return obj

		//
		data.scene = _t.scene
		data.terrain = _t.terrain
		data.syncs = _t.syncs
		//
		data.local = data.sid == _t.socket.io.engine.id
		// add object to queue if all resource loaded
		data.onready = function() {
			this.ready = true
			_t.objects.add(this)

			if (this.local) {
				_t.localObject = this
				this.mesh.add(_t.camera)
			}
		}
		//
		if (data.cls == 'Player' || data.cls == 'W3Player') {
			data.keys = _t.keys[data.sid] ||
				(_t.keys[data.sid] = { })
			data.terrainUpdateInterval = data.local ? 30 : 100
		}
		//
		try {
			obj = new this[data.cls](data)
		}
		catch (e) {
			obj = new Static(data)
		}

		// save it in objIndex
		obj.id = data.id
		_t.objIndex[data.id] = obj
		return obj
	}
	window.getObject = getObject

	_t.run = function(dt) {
		//
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
		//
		if (_t.syncs.length) {
			if (_t.hosting)
				_t.socket.emit('broadcast', getSyncData(_t.syncs))
			_t.syncs.length = 0
		}
		//
		_t.objects.run('run', dt)
	}
	_t.render = function(dt) {

		THREE.AnimationHandler.update(dt)
		_t.objects.run('render', dt)

		if (_t.localObject && !_t.localObject.finished) {
			var obj = _t.localObject,
				pos = obj.mesh.position
			_t.terrain.checkVisible(pos.x, pos.y)
			_t.sky.material.uniforms.fogBottom = pos.z
			_t.sky.material.uniforms.fogTop = pos.z + 2500
		}

		_t.renderer.render(_t.scene, _t.camera)
		_t.controls.update(dt)
		_t.stats.update()
	}

	// load the height map
	new ResLoaderBatch([
		{ url:'textures/terrain/China.png', handle:ResLoader.handleImg },
	], function(heightMap) {
		_t.terrain = new LodTerrain(_t.scene, heightMap)

		new ResLoader('models/mdl/blsss_01.txt', ResLoader.handleW3Char, function(geometries) {
			var mesh = new THREE.W3Character(geometries).root
			mesh.position.x = 1200
			mesh.rotation.z = Math.PI
			_t.terrain.addMesh(mesh)
		})

		new ResLoader('models/mdl/sssss_01.txt', ResLoader.handleW3Char, function(geometries) {
			var mesh = new THREE.W3Character(geometries).root
			mesh.position.x = 1000
			mesh.position.y = 1000
			mesh.rotation.z = Math.PI
			_t.terrain.addMesh(mesh)
		})

		initInput()
		connectToServer(url, conf.nojoin === undefined)
	})

	return _t
}

var Server = function(io) {

	var host = null,
		clients = { }

	function getClients() {
		return keach(clients, function(k, s, d) {
			d[k] = true
		}, { })
	}

	function setAsHost(socket) {
		host = socket
		socket.emit('hosting', getClients())
		console.log('[H] ' + socket.id + ' is now hosting')
	}

	function pingForHost(socket) {
		host = null
		socket.broadcast.emit('ping')
		console.log('[H] waiting for a new host...')
	}

	io.on('connection', function(socket) {
		var sid = socket.id
		clients[sid] = socket
		console.log('[C] ' + sid + ' connected')

		//
		if (!host) setAsHost(socket)
		host.emit('hosting', getClients())

		// ping!
		socket.on('ping', function(data) {
			if (!host)
				setAsHost(socket)
		})

		// broadcast event to clients
		socket.on('broadcast', function(data) {
			if (host === socket)
				socket.broadcast.emit('broadcast', data)
		})

		// redirect request to host
		socket.on('request', function(data) {
			data.sid = sid
			host && host.emit('request', data)
		})

		// always broadcast inputs
		socket.on('input', function(data) {
			data.sid = sid
			socket.broadcast.emit('input', data)
		})

		//
		socket.on('disconnect', function() {
			delete clients[sid]
			console.log('[C] ' + sid + ' disconnected')

			if (host === socket)
				pingForHost(socket)
			else if (host)
				host.emit('hosting', getClients())
		})
	})
}

if (typeof module !== 'undefined') {
	exports.Client = Client
	exports.Server = Server
}
