// پس‌زمینه سه‌بعدی با Three.js: شبکه نقاط و کندل‌های شناور
(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 14;

  // شبکه نقطه‌ای
  const count = 1500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 40;
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.05, transparent: true, opacity: 0.7 })
  );
  scene.add(points);

  // کندل‌های شناور
  const candles = [];
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.3 });
  for (let i = 0; i < 18; i++) {
    const up = Math.random() > 0.45;
    const h = 0.8 + Math.random() * 2.5;
    const geo = new THREE.BoxGeometry(0.35, h, 0.35);
    const mesh = new THREE.Mesh(geo, mat(up ? 0x22c55e : 0xef4444));
    mesh.position.set((i - 9) * 1.3, (Math.random() - 0.5) * 4, -4 - Math.random() * 3);
    mesh.userData.speed = 0.2 + Math.random() * 0.4;
    scene.add(mesh);
    candles.push(mesh);
  }

  const light = new THREE.PointLight(0x8b5cf6, 2, 50);
  light.position.set(5, 5, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  let mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    points.rotation.y = t * 0.03;
    points.rotation.x = mouseY * 0.1;
    points.rotation.z = mouseX * 0.05;
    candles.forEach((c) => {
      c.position.y += Math.sin(t * c.userData.speed) * 0.003;
      c.rotation.y = t * 0.2;
    });
    camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();
