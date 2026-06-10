// 球面经度分区着色 · Fragment Shader
// 用 uv 经纬度将球面分为 2-4 个颜色区域，smoothstep 渐变过渡
// 参考 dgreenheck/threejs-procedural-planets 的分色域方法

export const planetSurfaceVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetSurfaceFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform vec3 uZoneColors[4];
  uniform int uZoneCount;
  uniform float uTime;
  uniform float uTransitionWidth;

  void main() {
    // uv.x = 经度 (0→1 = 360°)
    // uv.y = 纬度 (0→1 = 北极→南极)
    float longitude = vUv.x;

    // 为每个区域计算权重
    float zoneWidth = 1.0 / float(uZoneCount);
    vec3 color = uZoneColors[0];
    float totalWeight = 0.0;

    for (int i = 0; i < 4; i++) {
      if (i >= uZoneCount) break;
      float zoneCenter = (float(i) + 0.5) * zoneWidth;
      float dist = abs(longitude - zoneCenter);
      // wrap around 0/1 boundary
      dist = min(dist, 1.0 - dist);
      float weight = 1.0 - smoothstep(0.0, uTransitionWidth, dist);
      color = mix(color, uZoneColors[i], weight / (weight + totalWeight + 0.001));
      totalWeight += weight;
    }

    // 简单的漫反射光照（太阳方向近似为摄像机上方偏前）
    float light = 0.5 + 0.5 * dot(vNormal, normalize(vec3(0.5, 0.8, 0.3)));
    color *= 0.6 + 0.4 * light;

    // 边缘微暗（菲涅尔效应，增强球体感）
    float fresnel = pow(1.0 - abs(vNormal.z), 2.0);
    color = mix(color, color * 0.4, fresnel * 0.5);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// 默认的分区颜色（各维度可覆盖）
export const DEFAULT_ZONE_COLORS: Record<number, string[]> = {
  2: ['#6b9e85', '#c4876b'],
  3: ['#5b7fa5', '#8b4a3a', '#c4a050'],
  4: ['#5b7fa5', '#8b4a3a', '#c4a050', '#6b9e85'],
};
