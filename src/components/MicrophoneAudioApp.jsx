import React, { useState, useRef, useEffect } from 'react';

const MicrophoneAudioApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const visualizerRef = useRef(null);
  const playerRef = useRef(null);

  // Add styles for wave animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wave-float-1 {
        0%, 100% { transform: translateX(-10px) translateY(0px) scaleY(1); }
        25% { transform: translateX(5px) translateY(-3px) scaleY(1.2); }
        50% { transform: translateX(10px) translateY(0px) scaleY(0.8); }
        75% { transform: translateX(-5px) translateY(3px) scaleY(1.1); }
      }
      
      @keyframes wave-float-2 {
        0%, 100% { transform: translateX(5px) translateY(-2px) scaleY(0.9); }
        33% { transform: translateX(-8px) translateY(2px) scaleY(1.3); }
        66% { transform: translateX(8px) translateY(-1px) scaleY(0.7); }
      }
      
      @keyframes wave-float-3 {
        0%, 100% { transform: translateX(-3px) translateY(1px) scaleY(1.1); }
        40% { transform: translateX(6px) translateY(-2px) scaleY(0.6); }
        80% { transform: translateX(-6px) translateY(1px) scaleY(1.4); }
      }
      
      @keyframes particle-float {
        0% { transform: translateY(0px) scale(1); opacity: 1; }
        50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
        100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
      }
      
      @keyframes bass-pulse {
        0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.3; }
        50% { transform: scaleX(1.2) scaleY(1.5); opacity: 0.7; }
      }
      
      .wave-animation-1 {
        animation: wave-float-1 2s ease-in-out infinite;
      }
      
      .wave-animation-2 {
        animation: wave-float-2 2.5s ease-in-out infinite;
      }
      
      .wave-animation-3 {
        animation: wave-float-3 1.8s ease-in-out infinite;
      }
      
      .bass-wave {
        animation: bass-pulse 1.5s ease-in-out infinite;
      }
      
      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background-color: currentColor;
        border-radius: 50%;
        animation: particle-float 3s linear infinite;
      }
      
      .particle-1 { left: 10%; animation-delay: 0s; }
      .particle-2 { left: 25%; animation-delay: 0.6s; }
      .particle-3 { left: 50%; animation-delay: 1.2s; }
      .particle-4 { left: 75%; animation-delay: 1.8s; }
      .particle-5 { left: 90%; animation-delay: 2.4s; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Instrument data
  const instruments = [
    { id: 'mic', name: 'Microphone', icon: '🎤', type: 'mic' },
    { id: 'draw', name: 'Draw', icon: '✏️', type: 'draw' },
    { id: 'flute', name: 'Flute', icon: '🪈', type: 'audio', frequency: 523.25 },
    { id: 'harp', name: 'Harp', icon: '🪕', type: 'audio', frequency: 261.63 },
    { id: 'whistle', name: 'Whistle', icon: '🎵', type: 'audio', frequency: 1046.5 },
    { id: 'trombone', name: 'Trombone', icon: '🎺', type: 'audio', frequency: 146.83 },
    { id: 'drums', name: 'Drums', icon: '🥁', type: 'audio', frequency: 80 },
    { id: 'birds', name: 'Birds', icon: '🐦', type: 'audio', frequency: 800 },
    { id: 'computer', name: 'Computer', icon: '💻', type: 'audio', frequency: 440 },
    { id: 'wine', name: 'Wine Glass', icon: '🍷', type: 'audio', frequency: 1000 }
  ];

  // Shader sources for 3D spectrogram
  const vertexShaderSource = `
    attribute vec3 gPosition;
    attribute vec2 gTexCoord0;
    
    uniform sampler2D vertexFrequencyData;
    uniform float vertexYOffset;
    uniform mat4 worldViewProjection;
    uniform float verticalScale;
    
    varying vec2 texCoord;
    varying vec3 color;
    
    vec3 convertHSVToRGB(float hue, float saturation, float lightness) {
      float chroma = lightness * saturation;
      float hueDash = hue / 60.0;
      float x = chroma * (1.0 - abs(mod(hueDash, 2.0) - 1.0));
      vec3 hsv = vec3(0.0);
      
      if(hueDash < 1.0) {
        hsv.r = chroma;
        hsv.g = x;
      } else if (hueDash < 2.0) {
        hsv.r = x;
        hsv.g = chroma;
      } else if (hueDash < 3.0) {
        hsv.g = chroma;
        hsv.b = x;
      } else if (hueDash < 4.0) {
        hsv.g = x;
        hsv.b = chroma;
      } else if (hueDash < 5.0) {
        hsv.r = x;
        hsv.b = chroma;
      } else if (hueDash < 6.0) {
        hsv.r = chroma;
        hsv.b = x;
      }
      return hsv;
    }
    
    void main() {
      float x = pow(256.0, gTexCoord0.x - 1.0);
      vec4 sample = texture2D(vertexFrequencyData, vec2(x, gTexCoord0.y + vertexYOffset));
      vec4 newPosition = vec4(gPosition.x, gPosition.y + verticalScale * sample.a, gPosition.z, 1.0);
      gl_Position = worldViewProjection * newPosition;
      texCoord = gTexCoord0;
      
      float hue = 360.0 - ((newPosition.y / verticalScale) * 360.0);
      color = convertHSVToRGB(hue, 1.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec2 texCoord;
    varying vec3 color;
    
    uniform sampler2D frequencyData;
    uniform vec4 backgroundColor;
    uniform float yoffset;
    
    void main() {
      float x = pow(256.0, texCoord.x - 1.0);
      float y = texCoord.y + yoffset;
      
      vec4 sample = texture2D(frequencyData, vec2(x, y));
      float k = sample.a;
      
      float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
      k *= fade;
      gl_FragColor = backgroundColor + vec4(k * color, 1.0);
    }
  `;

  // Initialize WebGL and create 3D spectrogram
  const initWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    // Create shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Error linking shader program:', gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    // Create 3D mesh for spectrogram
    const { vertexBuffer, indexBuffer, indicesCount } = create3DMesh(gl);
    
    // Create texture for frequency data
    const frequencyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, frequencyTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const vertexFrequencyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, vertexFrequencyTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Enable depth testing and set background color
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.83, 0.71, 0.63, 1.0); // Beige background

    return {
      gl,
      shaderProgram,
      vertexBuffer,
      indexBuffer,
      indicesCount,
      frequencyTexture,
      vertexFrequencyTexture,
      yOffset: 0,
      type: '3d'
    };
  };

  // Create shader
  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  // Create 3D mesh for spectrogram visualization
  const create3DMesh = (gl) => {
    const width = 128;
    const height = 128;
    const geometrySize = 9.5;

    const vertices = [];
    const indices = [];

    // Generate vertices
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        // Position
        const posX = geometrySize * (x - width / 2) / width;
        const posY = 0;
        const posZ = geometrySize * (z - height / 2) / height;
        
        // Texture coordinates
        const texX = x / (width - 1);
        const texY = z / (height - 1);

        vertices.push(posX, posY, posZ, texX, texY);
      }
    }

    // Generate indices
    for (let z = 0; z < height - 1; z++) {
      for (let x = 0; x < width - 1; x++) {
        const i = z * width + x;
        const iNext = i + width;

        // Two triangles per quad
        indices.push(i, i + 1, iNext + 1);
        indices.push(i, iNext + 1, iNext);
      }
    }

    // Create buffers
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      vertexBuffer,
      indexBuffer,
      indicesCount: indices.length
    };
  };

  // Create matrices for 3D transformation
  const createPerspectiveMatrix = (fov, aspect, near, far) => {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  };

  const createModelViewMatrix = (time) => {
    const xRot = -180 * Math.PI / 180;
    const yRot = (270 + Math.sin(time * 0.0005) * 30) * Math.PI / 180;
    const zRot = 90 * Math.PI / 180;

    const cosX = Math.cos(xRot), sinX = Math.sin(xRot);
    const cosY = Math.cos(yRot), sinY = Math.sin(yRot);
    const cosZ = Math.cos(zRot), sinZ = Math.sin(zRot);

    return new Float32Array([
      cosY * cosZ, cosY * sinZ, -sinY, 0,
      sinX * sinY * cosZ - cosX * sinZ, sinX * sinY * sinZ + cosX * cosZ, sinX * cosY, 0,
      cosX * sinY * cosZ + sinX * sinZ, cosX * sinY * sinZ - sinX * cosZ, cosX * cosY, 0,
      0, -2, -9, 1
    ]);
  };

  // Render 3D spectrogram
  const render3DSpectrogram = (frequencyData) => {
    const visualizer = visualizerRef.current;
    if (!visualizer || !frequencyData || visualizer.type !== '3d') return;

    const { gl, shaderProgram, vertexBuffer, indexBuffer, indicesCount, frequencyTexture, vertexFrequencyTexture } = visualizer;
    const canvas = canvasRef.current;
    if (!canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgram);

    // Update frequency texture
    const textureSize = 256;
    const textureData = new Uint8Array(textureSize * textureSize);
    
    // Fill texture with frequency data
    for (let y = 0; y < textureSize; y++) {
      for (let x = 0; x < textureSize; x++) {
        const freqIndex = Math.floor(x * frequencyData.length / textureSize);
        textureData[y * textureSize + x] = frequencyData[freqIndex];
      }
    }

    // Update main frequency texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frequencyTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, textureSize, textureSize, 0, gl.ALPHA, gl.UNSIGNED_BYTE, textureData);

    // Update vertex frequency texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, vertexFrequencyTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, textureSize, textureSize, 0, gl.ALPHA, gl.UNSIGNED_BYTE, textureData);

    // Update yOffset for scrolling effect
    visualizer.yOffset = (visualizer.yOffset + 0.005) % 1.0;

    // Set up matrices
    const projectionMatrix = createPerspectiveMatrix(55 * Math.PI / 180, canvas.width / canvas.height, 1, 100);
    const modelViewMatrix = createModelViewMatrix(Date.now());

    // Get uniform locations
    const projectionLocation = gl.getUniformLocation(shaderProgram, 'worldViewProjection');
    const frequencyDataLocation = gl.getUniformLocation(shaderProgram, 'frequencyData');
    const vertexFrequencyDataLocation = gl.getUniformLocation(shaderProgram, 'vertexFrequencyData');
    const vertexYOffsetLocation = gl.getUniformLocation(shaderProgram, 'vertexYOffset');
    const verticalScaleLocation = gl.getUniformLocation(shaderProgram, 'verticalScale');
    const yoffsetLocation = gl.getUniformLocation(shaderProgram, 'yoffset');
    const backgroundColorLocation = gl.getUniformLocation(shaderProgram, 'backgroundColor');

    // Set uniforms
    gl.uniformMatrix4fv(projectionLocation, false, modelViewMatrix);
    gl.uniform1i(frequencyDataLocation, 0);
    gl.uniform1i(vertexFrequencyDataLocation, 1);
    gl.uniform1f(vertexYOffsetLocation, visualizer.yOffset);
    gl.uniform1f(verticalScaleLocation, 2.7);
    gl.uniform1f(yoffsetLocation, visualizer.yOffset);
    gl.uniform4fv(backgroundColorLocation, [0.83, 0.71, 0.63, 1.0]); // Beige background

    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    
    const positionLocation = gl.getAttribLocation(shaderProgram, 'gPosition');
    const texCoordLocation = gl.getAttribLocation(shaderProgram, 'gTexCoord0');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 20, 0);

    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 20, 12);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0);
  };

  // Initialize audio player for instruments
  const initAudioPlayer = () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0;

    const gainNode = context.createGain();
    gainNode.connect(analyserNode);
    analyserNode.connect(context.destination);

    return {
      context,
      analyser: analyserNode,
      gainNode,
      currentSource: null
    };
  };

  // Play instrument sound
  const playInstrument = async (instrument) => {
    if (!isRecording) return; // Only allow if recording mode is active

    // Stop previous instrument
    if (playerRef.current && playerRef.current.currentSource) {
      try {
        playerRef.current.currentSource.stop();
      } catch (e) {}
      playerRef.current.currentSource = null;
    }

    if (selectedInstrument === instrument.id) {
      setSelectedInstrument(null);
      return;
    }

    if (instrument.type === 'mic') {
      // Switch to microphone
      startMicrophone();
      setSelectedInstrument('mic');
      return;
    }

    try {
      if (!playerRef.current) {
        playerRef.current = initAudioPlayer();
      }

      const { context, analyser, gainNode } = playerRef.current;

      // Resume context if suspended
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Create oscillator for instrument - this will play continuously
      const oscillator = context.createOscillator();
      oscillator.type = instrument.id === 'drums' ? 'sawtooth' : 
                       instrument.id === 'computer' ? 'square' : 'sine';
      
      oscillator.frequency.value = instrument.frequency || 440;
      oscillator.connect(gainNode);
      oscillator.start();

      // Add some frequency modulation for more interesting sounds
      if (instrument.id === 'birds') {
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();
        lfo.frequency.value = 5; // 5Hz modulation
        lfoGain.gain.value = 50; // Modulation depth
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.start();
      }

      playerRef.current.currentSource = oscillator;
      setAnalyser(analyser);
      setSelectedInstrument(instrument.id);

      // No auto-stop - sound continues until another instrument is selected

    } catch (error) {
      console.error('Error playing instrument:', error);
    }
  };

  // Start microphone access
  const startMicrophone = async () => {
    try {
      // Stop any existing audio
      if (playerRef.current && playerRef.current.currentSource) {
        try {
          playerRef.current.currentSource.stop();
        } catch (e) {}
        playerRef.current.currentSource = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const context = new AudioContext();
      setAudioContext(context);

      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0;

      source.connect(analyserNode);
      setAnalyser(analyserNode);
      setSelectedInstrument('mic');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(`Error accessing microphone: ${error.message}`);
    }
  };

  // Start recording (main function)
  const startRecording = async () => {
    setIsRecording(true);
    
    // Initialize 3D visualization
    setTimeout(() => {
      if (!visualizerRef.current) {
        visualizerRef.current = initWebGL();
      }
      
      // Start with microphone by default
      startMicrophone();
      startVisualization();
    }, 100);
  };

  // Stop recording
  const stopRecording = () => {
    // Stop all audio
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }

    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }

    if (playerRef.current && playerRef.current.currentSource) {
      try {
        playerRef.current.currentSource.stop();
      } catch (e) {}
      playerRef.current.currentSource = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset all state
    setAnalyser(null);
    setIsRecording(false);
    setSelectedInstrument(null);
    visualizerRef.current = null;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Visualization loop
  const startVisualization = () => {
    const animate = () => {
      if (!isRecording || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      render3DSpectrogram(dataArray);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const updateSize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (visualizerRef.current && visualizerRef.current.gl) {
          visualizerRef.current.gl.viewport(0, 0, canvas.width, canvas.height);
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#B8E0E8' }}>
      <div className="container mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-black mb-8">
            Welcome to the Interview Test Web Page
          </h1>
          
          {/* Visualization Area */}
          <div className="mx-auto mb-8" style={{ width: '900px', height: '550px' }}>
            <div 
              className="relative w-full h-full border-8 rounded-lg overflow-hidden"
              style={{ 
                borderColor: '#9CB86F',
                backgroundColor: isRecording ? '#D4B5A0' : '#000000'
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ 
                  backgroundColor: isRecording ? '#D4B5A0' : '#000000'
                }}
              />
              
              {/* Sound Waves - show when instrument is playing */}
              {isRecording && selectedInstrument && selectedInstrument !== 'mic' && (
                <div className="absolute top-6 left-0 right-0 h-24 pointer-events-none">
                  <div className="relative w-full h-full overflow-hidden">
                    {/* Multiple wave layers for different instruments */}
                    <div 
                      className={`absolute inset-0 opacity-80 ${
                        selectedInstrument === 'flute' ? 'text-blue-400' :
                        selectedInstrument === 'harp' ? 'text-yellow-400' :
                        selectedInstrument === 'whistle' ? 'text-green-400' :
                        selectedInstrument === 'trombone' ? 'text-red-400' :
                        selectedInstrument === 'drums' ? 'text-purple-400' :
                        selectedInstrument === 'birds' ? 'text-pink-400' :
                        selectedInstrument === 'computer' ? 'text-cyan-400' :
                        selectedInstrument === 'wine' ? 'text-orange-400' :
                        'text-white'
                      }`}
                    >
                      {/* Different wave patterns for different instruments */}
                      {selectedInstrument === 'drums' ? (
                        // Drums - Sharp spiky waves with bass effect
                        <>
                          <div className="absolute inset-0 bass-wave border-2 border-current rounded-lg opacity-30"></div>
                          <svg className="w-full h-full wave-animation-1" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 L30,25 L60,75 L90,15 L120,85 L150,20 L180,80 L210,30 L240,70 L270,40 L300,60 L330,35 L360,80 L390,20 L420,85 L450,15 L480,75 L510,25 L540,65 L570,35 L600,50"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                            />
                          </svg>
                        </>
                      ) : selectedInstrument === 'trombone' ? (
                        // Trombone - Deep bass waves
                        <>
                          <div className="absolute inset-0 bass-wave bg-current rounded-lg opacity-20"></div>
                          <svg className="w-full h-full wave-animation-1" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q75,75 150,25 Q225,90 300,15 Q375,85 450,35 Q525,95 600,50"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                          </svg>
                          <svg className="absolute top-0 w-full h-full wave-animation-2" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q60,25 120,75 Q180,15 240,85 Q300,25 360,75 Q420,15 480,85 Q540,25 600,50"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              opacity="0.7"
                            />
                          </svg>
                        </>
                      ) : selectedInstrument === 'birds' ? (
                        // Birds - Chirpy irregular waves  
                        <>
                          <svg className="w-full h-full wave-animation-2" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q30,25 60,50 Q90,75 120,35 Q150,15 180,65 Q210,85 240,40 Q270,20 300,60 Q330,80 360,30 Q390,10 420,70 Q450,90 480,35 Q510,15 540,65 Q570,85 600,50"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                          <div className="absolute inset-0">
                            <div className="particle particle-1"></div>
                            <div className="particle particle-2"></div>
                            <div className="particle particle-3"></div>
                            <div className="particle particle-4"></div>
                            <div className="particle particle-5"></div>
                          </div>
                        </>
                      ) : selectedInstrument === 'computer' ? (
                        // Computer - Digital square waves
                        <>
                          <svg className="w-full h-full wave-animation-3" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 L75,50 L75,25 L150,25 L150,75 L225,75 L225,35 L300,35 L300,65 L375,65 L375,30 L450,30 L450,70 L525,70 L525,40 L600,40"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                          <div className="absolute inset-0">
                            <div className="particle particle-1"></div>
                            <div className="particle particle-2"></div>
                            <div className="particle particle-3"></div>
                          </div>
                        </>
                      ) : (
                        // Default smooth waves for other instruments
                        <>
                          <svg className="w-full h-full wave-animation-1" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q150,25 300,50 T600,50"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              opacity="0.9"
                            />
                          </svg>
                          
                          <svg className="absolute top-0 w-full h-full wave-animation-2" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q75,75 150,50 T300,50 T450,50 T600,50"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              opacity="0.7"
                            />
                          </svg>
                          
                          <svg className="absolute top-0 w-full h-full wave-animation-3" viewBox="0 0 600 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 Q37.5,35 75,50 T150,50 T225,50 T300,50 T375,50 T450,50 T525,50 T600,50"
                              stroke="currentColor"
                              strokeWidth="1"
                              fill="none"
                              opacity="0.5"
                            />
                          </svg>
                        </>
                      )}
                    </div>
                    
                    {/* Instrument name display */}
                    <div className="absolute top-2 right-6 text-white bg-black bg-opacity-60 px-4 py-2 rounded-full text-sm font-medium">
                      🎵 {instruments.find(i => i.id === selectedInstrument)?.name}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Instrument Controls - show inside the screen when recording */}
              {isRecording && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex flex-wrap justify-center gap-3 bg-black bg-opacity-70 p-3 rounded-lg">
                    {instruments.map((instrument) => (
                      <button
                        key={instrument.id}
                        onClick={() => playInstrument(instrument)}
                        className={`w-12 h-12 rounded-full text-lg transition-all duration-200 transform hover:scale-110 ${
                          selectedInstrument === instrument.id
                            ? 'bg-green-500 shadow-lg'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        title={instrument.name}
                      >
                        {instrument.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Message - only show when recording */}
          {isRecording && (
            <div className="mb-6">
              <p className="text-lg font-semibold text-black">
                YOUR MICROPHONE IS ON. YOU ARE NOW RECORDING!
              </p>
            </div>
          )}
          
          {/* Control Button */}
          <div>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-8 py-4 text-white font-bold text-lg rounded-lg border-4 border-purple-800 shadow-lg transform hover:scale-105 transition-transform"
                style={{ backgroundColor: '#8B5FBF' }}
              >
                CLICK HERE TO START RECORDING!
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-8 py-4 text-white font-bold text-lg rounded-lg border-4 border-green-800 shadow-lg transform hover:scale-105 transition-transform"
                style={{ backgroundColor: '#4CAF50' }}
              >
                CLICK HERE TO STOP RECORDING
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneAudioApp;
