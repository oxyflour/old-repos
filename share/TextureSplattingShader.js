// modified from http://stemkoski.github.io/Three.js/Shader-Heightmap-Textures.html
// and THREE.ShaderLib.lambert

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
			maxHeight: { type:'f', value:1024 },
			bumpTexture:  { type:'t', value:null },
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

		"uniform float maxHeight;",
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
		//THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],,

		"void main() {",
			"vUV = uv;",
			"vAmount = position.z / maxHeight;",

			//THREE.ShaderChunk[ "map_vertex" ],
			//THREE.ShaderChunk[ "lightmap_vertex" ],
			//THREE.ShaderChunk[ "color_vertex" ],

			//THREE.ShaderChunk[ "morphnormal_vertex" ],
			//THREE.ShaderChunk[ "skinbase_vertex" ],
			//THREE.ShaderChunk[ "skinnormal_vertex" ],
			THREE.ShaderChunk[ "defaultnormal_vertex" ],

			//THREE.ShaderChunk[ "morphtarget_vertex" ],
			//THREE.ShaderChunk[ "skinning_vertex" ],
			THREE.ShaderChunk[ "default_vertex" ],
			//THREE.ShaderChunk[ "logdepthbuf_vertex" ],

			THREE.ShaderChunk[ "worldpos_vertex" ],
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
			"vec4 water = (1. - s1) * texture2D( oceanTexture, vUV * 10.0 );",
			"vec4 sandy = (s1 - s2) * texture2D( sandyTexture, vUV * 10.0 );",
			"vec4 grass = (s2 - s3) * texture2D( grassTexture, vUV * 20.0 );",
			"vec4 rocky = (s3 - s4) * texture2D( rockyTexture, vUV * 20.0 );",
			"vec4 snowy = (s4) * texture2D( snowyTexture, vUV * 10.0 );",

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