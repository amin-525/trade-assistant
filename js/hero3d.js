// پس‌زمینه سه‌بعدی سبک و روان: انیمیشن با زمان واقعی، بدون ساخت شیء در هر فریم
(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  // سقف ۱٫۵ برای پیکسل‌ریشو: کیفیت خوب و هزینه GPU کم
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 14;

  // ذرات شناور
  const COUNT = 1200;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 40;
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false })
  );
  scene.add(points);

  // کندل‌های شناور (متریال ساده و سبک)
  const GREEN = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35 });
  const RED = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
  const candles = [];
  for (let i = 0; i < 18; i++) {
    const h = 0.8 + Math.random() * 2.5;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, h, 0.35), Math.random() > 0.45 ? GREEN : RED);
    mesh.position.set((i - 9) * 1.3, (Math.random() - 0.5) * 4, -4 - Math.random() * 3);
    mesh.userData.speed = 0.4 + Math.random() * 0.6;
    scene.add(mesh);
    candles.push(mesh);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // ماوس با lerp نرم
  let mouseX = 0, mouseY = 0, camX = 0, camY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // انیمیشن با dt تا سرعت روی همه نمایشگرها (۶۰/۱۲۰/۱۴۴ هرتز) یکسان بماند
  let last = performance.now();
  let elapsed = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;

    points.rotation.y += dt * 0.03;
    points.rotation.x = mouseY * 0.1;
    points.rotation.z = mouseX * 0.05;
    for (const c of candles) {
      c.position.y += Math.sin(elapsed * c.userData.speed) * dt * 0.25;
      c.rotation.y += dt * 0.2;
    }

    const k = 1 - Math.pow(0.001, dt); // lerp مستقل از فریم‌ریت
    camX += (mouseX * 1.2 - camX) * k;
    camY += (-mouseY * 1.2 - camY) * k;
    camera.position.set(camX, camY, camera.position.z);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((t) => { last = t; frame(t); });
})();
