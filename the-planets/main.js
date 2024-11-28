import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  24,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const radius = 1.3;
const segment = 32;
const colors = [0xff0000, 0x0000ff, 0xffff00, 0xffff00];
const spheres = new THREE.Group();
const orbitRadius = 4.5;
const textures = ["csilla/map.jpg", "earth/map.jpg", "venus/map.jpg", "volcanic/map.jpg"];
const spheresRotation = [1, 1.5, 20, 2];

const starTexture = new THREE.TextureLoader().load("./stars.jpg");
const starGeometry = new THREE.SphereGeometry(50, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide,
});
const starSphere = new THREE.Mesh(starGeometry, starMaterial);
starTexture.colorSpace = THREE.SRGBColorSpace;
scene.add(starSphere);

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/goegap_road_2k.hdr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;

    scene.environment = texture;
    console.log("loaded");
  },
  null,
  (error) => {
    console.log(error);
  }
);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
backLight.position.set(0, -5, -5);
scene.add(backLight);

let spheresMesh = [];

for (let i = 0; i < 4; i++) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(`./${textures[i]}`);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(radius, segment, segment);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);

  spheresMesh.push(sphere);

  const angle = (i / 4) * (Math.PI * 2);
  sphere.position.x = orbitRadius * Math.cos(angle);
  sphere.position.z = orbitRadius * Math.sin(angle);
  spheres.add(sphere);
}
spheres.rotation.x = 0.08;
spheres.position.y = -0.8;
scene.add(spheres);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 10;

let lastWheelTime = 0;
const throttleDelay = 1000;
let scrollCount = 0;


function throttleWheelHandler(event) {
  const currentTime = Date.now();
  if (currentTime - lastWheelTime >= throttleDelay) {
    lastWheelTime = currentTime;

    const direction = event.deltaY > 0 ? "down" : "up";
    const headings = document.querySelectorAll(".heading");

    if (direction === "down") {
      // Animate downwards
      gsap.to(headings, {
        duration: 1,
        y: `-=${100}%`,
        ease: "power2.inOut",
      });

      gsap.to(spheres.rotation, {
        duration: 1,
        y: `-=${Math.PI / 2}`,
        ease: "power2.inOut",
      });

      scrollCount = (scrollCount + 1) % 4;
      console.log("Scroll Down:", scrollCount);

      if (scrollCount === 0) {
        // Reset to first heading after full cycle
        gsap.to(headings, {
          duration: 1,
          y: "0%",
          ease: "power2.inOut",
        });
      }
    } else if (direction === "up") {
      // Animate upwards
      if (scrollCount === 0) {
        // Prevent further upward scroll if already at the first heading
        return;
      }

      gsap.to(headings, {
        duration: 1,
        y: `+=${100}%`,
        ease: "power2.inOut",
      });

      gsap.to(spheres.rotation, {
        duration: 1,
        y: `+=${Math.PI / 2}`,
        ease: "power2.inOut",
      });

      scrollCount = (scrollCount - 1 + 4) % 4; // Ensure scrollCount stays within range
      console.log("Scroll Up:", scrollCount);
    }
  }
}

// Initialize touch variables for mobile handling
let lastTouchX = 0;

function handleTouchStart(event) {
  lastTouchX = event.touches[0].clientX;
}

function handleTouchMove(event) {
  const currentTouchX = event.touches[0].clientX;
  const deltaX = currentTouchX - lastTouchX;
  lastTouchX = currentTouchX;

  // Simulate a "wheel" event for touch devices
  throttleWheelHandler({ deltaY: -deltaX });
}

// Add listeners for both desktop and mobile
window.addEventListener("wheel", throttleWheelHandler, { passive: true });
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < spheresMesh.length; i++) {
    const sphere = spheresMesh[i];
    sphere.rotation.y += spheresRotation[i] / 10000;
  }
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
