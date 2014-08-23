// modified from http://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html
// and THREE.ShaderLib.lambert

THREE.ShaderLib.TextureSplattingDepth = {
	uniforms: {
		heightMapScale: { type:'f', value:256 },
		heightMapSize:  { type:'f', value:1024 },
		heightMap: { type:'t', value:null },
	},
	vertexShader: [
		"uniform sampler2D heightMap;",
		"uniform float heightMapScale;",
		"uniform float heightMapSize;",

		"void main() {",
			"vec4 heightData = texture2D( heightMap, position.xy / heightMapSize + 0.5 );",
			"float fBump = heightData.a;",

			"vec4 mvPosition = modelViewMatrix * vec4( position + normal * fBump * heightMapScale, 1.0);",
			"gl_Position = projectionMatrix * mvPosition;",
		"}",
	].join('\n'),
	fragmentShader: THREE.ShaderLib.depthRGBA.fragmentShader
}

THREE.ShaderLib.TextureSplattingShader = {

	uniforms: THREE.UniformsUtils.merge([
		THREE.UniformsLib['common'],
		THREE.UniformsLib['fog'],
		THREE.UniformsLib['lights'],
		THREE.UniformsLib['shadowmap'],
		{
			ambient  : { type: "c", value: new THREE.Color( 0xffffff ) },
			emissive : { type: "c", value: new THREE.Color( 0x000000 ) },
			wrapRGB  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) }
		},
		{
			heightMapScale: { type:'f', value:256 },
			heightMapSize:  { type:'f', value:1024 },
			heightMap:    { type:'t', value:null },
			oceanTexture: { type:'t', value:null },
			sandyTexture: { type:'t', value:null },
			grassTexture: { type:'t', value:null },
			rockyTexture: { type:'t', value:null },
			snowyTexture: { type:'t', value:null },
		}
	]),

	vertexShader: [
		"varying vec3 vLightFront;",
		"#ifdef DOUBLE_SIDED",
		"	varying vec3 vLightBack;",
		"#endif",,

		"uniform sampler2D heightMap;",
		"uniform float heightMapScale;",
		"uniform float heightMapSize;",

		"varying float vAmount;",
		"varying vec2 vUV;",

		//THREE.ShaderChunk[ "map_pars_vertex" ],
		//THREE.ShaderChunk[ "lightmap_pars_vertex" ],
		//THREE.ShaderChunk[ "envmap_pars_vertex" ],
		THREE.ShaderChunk[ "lights_lambert_pars_vertex" ],
		//THREE.ShaderChunk[ "color_pars_vertex" ],
		//THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
		//THREE.ShaderChunk[ "skinning_pars_vertex" ],
		THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
		//THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],

		"void main() {",
			"vUV = position.xy / 1024.;",
			"vec4 heightData = texture2D( heightMap, position.xy / heightMapSize + 0.5 );",
			"float fBump = heightData.a;",
			"vAmount = fBump;",

			//THREE.ShaderChunk[ "map_vertex" ],
			//THREE.ShaderChunk[ "lightmap_vertex" ],
			//THREE.ShaderChunk[ "color_vertex" ],

			//THREE.ShaderChunk[ "morphnormal_vertex" ],
			//THREE.ShaderChunk[ "skinbase_vertex" ],
			//THREE.ShaderChunk[ "skinnormal_vertex" ],

			// to replace THREE.ShaderChunk[ "defaultnormal_vertex" ],
			"vec3 objectNormal = vec3( heightData.rgb ) * 2. - 1.;",
			"vec3 transformedNormal = normalMatrix * objectNormal;",

			//THREE.ShaderChunk[ "morphtarget_vertex" ],
			//THREE.ShaderChunk[ "skinning_vertex" ],

			// to replace THREE.ShaderChunk[ "default_vertex" ],
			"vec4 newPosition = vec4( position + normal * fBump * heightMapScale, 1.0);",
			"vec4 mvPosition = modelViewMatrix * newPosition;",
			"gl_Position = projectionMatrix * mvPosition;",

			//THREE.ShaderChunk[ "logdepthbuf_vertex" ],

			// to replace THREE.ShaderChunk[ "worldpos_vertex" ],
			"vec4 worldPosition = modelMatrix * newPosition;",

			//THREE.ShaderChunk[ "envmap_vertex" ],
			THREE.ShaderChunk[ "lights_lambert_vertex" ],
			THREE.ShaderChunk[ "shadowmap_vertex" ],

		"}",
	].join('\n'),

	fragmentShader: [
		"uniform float opacity;",
		"varying vec3 vLightFront;",
		"#ifdef DOUBLE_SIDED",
		"	varying vec3 vLightBack;",
		"#endif",

		"uniform sampler2D oceanTexture;",
		"uniform sampler2D sandyTexture;",
		"uniform sampler2D grassTexture;",
		"uniform sampler2D rockyTexture;",
		"uniform sampler2D snowyTexture;",
		"varying vec2 vUV;",
		"varying float vAmount;",

		//THREE.ShaderChunk[ "color_pars_fragment" ],
		//THREE.ShaderChunk[ "map_pars_fragment" ],
		//THREE.ShaderChunk[ "alphamap_pars_fragment" ],
		//THREE.ShaderChunk[ "lightmap_pars_fragment" ],
		//THREE.ShaderChunk[ "envmap_pars_fragment" ],
		THREE.ShaderChunk[ "fog_pars_fragment" ],
		THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
		//THREE.ShaderChunk[ "specularmap_pars_fragment" ],
		//THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],

		"void main() {",
			"float s1 = smoothstep(0.05, 0.20, vAmount);",
			"float s2 = smoothstep(0.20, 0.30, vAmount);",
			"float s3 = smoothstep(0.30, 0.45, vAmount);",
			"float s4 = smoothstep(0.45, 0.70, vAmount);",
			"vec4 water = (1. - s1) * texture2D( oceanTexture, vUV );",
			"vec4 sandy = (s1 - s2) * texture2D( sandyTexture, vUV );",
			"vec4 grass = (s2 - s3) * texture2D( grassTexture, vUV * 2. );",
			"vec4 rocky = (s3 - s4) * texture2D( rockyTexture, vUV * 2. );",
			"vec4 snowy = (s4 - 0.) * texture2D( snowyTexture, vUV );",

			"gl_FragColor = water + sandy + grass + rocky + snowy;",

			//THREE.ShaderChunk[ "logdepthbuf_fragment" ],
			//THREE.ShaderChunk[ "map_fragment" ],
			//THREE.ShaderChunk[ "alphamap_fragment" ],
			//THREE.ShaderChunk[ "alphatest_fragment" ],
			//THREE.ShaderChunk[ "specularmap_fragment" ],

			"	#ifdef DOUBLE_SIDED",
			//"float isFront = float( gl_FrontFacing );",
			//"gl_FragColor.xyz *= isFront * vLightFront + ( 1.0 - isFront ) * vLightBack;",
			"		if ( gl_FrontFacing )",
			"			gl_FragColor.xyz *= vLightFront;",
			"		else",
			"			gl_FragColor.xyz *= vLightBack;",
			"	#else",
			"		gl_FragColor.xyz *= vLightFront;",
			"	#endif",

			//THREE.ShaderChunk[ "lightmap_fragment" ],
			//THREE.ShaderChunk[ "color_fragment" ],
			//THREE.ShaderChunk[ "envmap_fragment" ],
			THREE.ShaderChunk[ "shadowmap_fragment" ],

			//THREE.ShaderChunk[ "linear_to_gamma_fragment" ],

			THREE.ShaderChunk[ "fog_fragment" ],
		"}",
	].join('\n'),
}