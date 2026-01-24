import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Globe = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const globeGeometry = new THREE.SphereGeometry(0.8, 24, 24);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0x2a2a2a,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    const latLines = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const lat = (i / 8) * Math.PI;
      const radius = Math.sin(lat) * 0.8;
      const y = Math.cos(lat) * 0.8;
      
      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        0, 2 * Math.PI,
        false,
        0
      );
      
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.4
      });
      const line = new THREE.Line(geometry, material);
      line.rotation.x = Math.PI / 2;
      line.position.y = y - 0.8;
      latLines.add(line);
    }
    scene.add(latLines);

    const lonLines = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const curve = new THREE.EllipseCurve(
        0, 0,
        0.8, 0.8,
        0, Math.PI * 2,
        false,
        0
      );
      
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(geometry, material);
      line.rotation.y = angle;
      lonLines.add(line);
    }
    scene.add(lonLines);

    const dotsGroup = new THREE.Group();
    const dotGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xaadd44,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < 150; i++) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.81;
      
      dot.position.x = radius * Math.sin(phi) * Math.cos(theta);
      dot.position.y = radius * Math.sin(phi) * Math.sin(theta);
      dot.position.z = radius * Math.cos(phi);
      
      const scale = 0.8 + Math.random() * 0.6;
      dot.scale.set(scale, scale, scale);
      
      dotsGroup.add(dot);
    }
    scene.add(dotsGroup);

    const glowGeometry = new THREE.SphereGeometry(0.85, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowSphere);

    const ringGeometry = new THREE.TorusGeometry(0.82, 0.002, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    let animationId: number;
    let time = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      
      globe.rotation.y += 0.002;
      latLines.rotation.y += 0.002;
      lonLines.rotation.y += 0.002;
      dotsGroup.rotation.y += 0.002;
      ring.rotation.z += 0.001;
      
      dotsGroup.children.forEach((dot, i) => {
        const offset = i * 0.1;
        const mesh = dot as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6 + Math.sin(time + offset) * 0.4;
      });
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      globeGeometry.dispose();
      globeMaterial.dispose();
      dotGeometry.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full"></div>
    </div>
  );
};
