// script.js

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const exerciseScreen = document.getElementById('exercise-screen');
    const instruction = document.getElementById('instruction');
    const circle = document.getElementById('circle');
    const timerDisplay = document.getElementById('timer');
    const endSessionButton = document.getElementById('end-session');
    const reportScreen = document.getElementById('report-screen');
    const totalTimeDisplay = document.getElementById('total-time');
    const totalBreathsDisplay = document.getElementById('total-breaths');
    const averageBreathInDisplay = document.getElementById('average-breath-in');
    const downloadReport = document.getElementById('download-report');
  
    // Starfield variables
    const starfieldCanvas = document.getElementById('starfield');
    const ctx = starfieldCanvas.getContext('2d');
    let stars = [];
    let starSpeed = 0;
    let speedIncrement = 0;
    let isBreathingIn = false;
  
    const maxStarSpeed = 10;
    let pulsating = false;
  
    // Background color variables
    const body = document.body;
  
    // Resize canvas to full screen
    function resizeCanvas() {
      starfieldCanvas.width = window.innerWidth;
      starfieldCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  
    // Initialize stars
    function initStars() {
      const numStars = window.innerWidth < 600 ? 100 : 200; // Adjust number of stars for performance
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push(createStar());
      }
    }
  
    function createStar() {
      return {
        x: (Math.random() - 0.5) * starfieldCanvas.width, // Centered around 0
        y: (Math.random() - 0.5) * starfieldCanvas.height, // Centered around 0
        z: Math.random() * starfieldCanvas.width + 1, // Avoid z=0 to prevent division by zero
        o: Math.random() * 0.5 + 0.5, // Opacity between 0.5 and 1
        size: Math.random() * 1.5 + 0.5,
      };
    }
  
    // Update starfield animation
    function updateStars() {
      ctx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
  
      const centerX = starfieldCanvas.width / 2;
      const centerY = starfieldCanvas.height / 2;
  
      for (let i = 0; i < stars.length; i++) {
        let star = stars[i];
  
        // Move star along the z-axis
        star.z -= starSpeed;
  
        // Reset star if it goes past the viewer
        if (star.z <= 0) {
          stars[i] = createStar();
          stars[i].z = starfieldCanvas.width;
          continue;
        }
  
        // Project 3D coordinates to 2D screen positions
        const k = 128.0 / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;
  
        // Adjust star brightness based on speed
        const brightness = Math.min((starSpeed / maxStarSpeed) + 0.5, 1); // Brightness between 0.5 and 1
  
        // Only draw stars within canvas bounds
        if (px >= 0 && px <= starfieldCanvas.width && py >= 0 && py <= starfieldCanvas.height) {
          const size = star.size * (1 - star.z / starfieldCanvas.width);
          ctx.beginPath();
          ctx.arc(px, py, size, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(255, 255, 255, ${star.o * brightness})`;
          ctx.fill();
        } else {
          // Reset star if it moves out of view
          stars[i] = createStar();
          stars[i].z = starfieldCanvas.width;
        }
      }
  
      requestAnimationFrame(updateStars);
    }
  
    // Start the starfield animation
    initStars();
    updateStars();
  
    // Breathing variables
    let breathInTimes = [];
    let sessionStartTime;
    let breathStartTime;
    let breathTimerInterval;
  
    // Start the session
    startButton.addEventListener('click', () => {
      welcomeScreen.style.display = 'none';
      exerciseScreen.style.display = 'block';
      sessionStartTime = Date.now();
    });
  
    // Record breath in time and start animation
    circle.addEventListener('mousedown', startBreathIn);
    circle.addEventListener('touchstart', startBreathIn);
  
    function startBreathIn(e) {
      e.preventDefault();
      breathStartTime = Date.now();
      timerDisplay.textContent = '0.00s';
      breathTimerInterval = setInterval(updateBreathTimer, 10);
      isBreathingIn = true;
      speedIncrement = 0.2; // Start accelerating
    }
  
    // Record breath out time and reset animation
    circle.addEventListener('mouseup', endBreathIn);
    circle.addEventListener('mouseleave', endBreathIn);
    circle.addEventListener('touchend', endBreathIn);
    circle.addEventListener('touchcancel', endBreathIn);
  
    function endBreathIn(e) {
      if (!breathStartTime) return;
      const breathEndTime = Date.now();
      const duration = (breathEndTime - breathStartTime) / 1000;
      breathInTimes.push(duration);
      clearInterval(breathTimerInterval);
      breathStartTime = null;
      timerDisplay.textContent = '0.00s';
      isBreathingIn = false;
      speedIncrement = -0.15; // Start decelerating
      stopPulsating();
    }
  
    function updateBreathTimer() {
      const currentTime = (Date.now() - breathStartTime) / 1000;
      timerDisplay.textContent = `${currentTime.toFixed(2)}s`;
    }
  
    function startPulsating() {
      pulsating = true;
      circle.classList.add('pulsating');
    }
  
    function stopPulsating() {
      if (pulsating) {
        pulsating = false;
        circle.classList.remove('pulsating');
      }
    }
  
    // End the session and generate report
    endSessionButton.addEventListener('click', () => {
      exerciseScreen.style.display = 'none';
      reportScreen.style.display = 'block';
      generateReport();
    });
  
    // Generate the report
    function generateReport() {
      // Calculate metrics
      const totalSessionTime = ((Date.now() - sessionStartTime) / 1000).toFixed(2);
      const totalBreaths = breathInTimes.length;
      const averageBreathIn = (breathInTimes.reduce((a, b) => a + b, 0) / totalBreaths || 0).toFixed(2);
  
      // Update report content
      totalTimeDisplay.textContent = `Total Session Time: ${totalSessionTime} seconds`;
      totalBreathsDisplay.textContent = `Total Breaths: ${totalBreaths}`;
      averageBreathInDisplay.textContent = `Average Breath-In Time: ${averageBreathIn} seconds`;
  
      // Generate image for download
      generateReportImage(totalSessionTime, totalBreaths, averageBreathIn);
    }
  
    // Generate a stylish report image
    function generateReportImage(totalTime, totalBreaths, avgBreathIn) {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
  
      // Background
      ctx.fillStyle = '#000019'; // Match the deep navy background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Decorative elements
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.textAlign = 'center';
  
      // Title
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('Breathing Session Report', canvas.width / 2, 80);
  
      // Total Time
      ctx.font = '30px Arial';
      ctx.fillText(`Total Session Time: ${totalTime} seconds`, canvas.width / 2, 180);
  
      // Total Breaths
      ctx.fillText(`Total Breaths: ${totalBreaths}`, canvas.width / 2, 240);
  
      // Average Breath-In Time
      ctx.fillText(`Average Breath-In Time: ${avgBreathIn} seconds`, canvas.width / 2, 300);
  
      // Decorative Ring
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 450, 100, 0, 2 * Math.PI);
      ctx.stroke();
  
      // Prepare the download link
      downloadReport.href = canvas.toDataURL('image/png');
    }
  
    // Update star speed and background color based on breathing
    function updateStarSpeed() {
      if (isBreathingIn) {
        // Increase speed smoothly
        starSpeed += speedIncrement;
        if (starSpeed >= maxStarSpeed) {
          starSpeed = maxStarSpeed; // Maximum speed limit
        }
  
        // Update circle size
        const scale = 1 + 0.3 * (starSpeed / maxStarSpeed); // scale from 1 to 1.5
        circle.style.transform = `scale(${scale})`;
  
        // Start pulsating effect when max size is reached
        if (starSpeed === maxStarSpeed && !pulsating) {
          startPulsating();
        }
  
      } else {
        // Decrease speed smoothly
        starSpeed += speedIncrement;
        if (starSpeed <= 0) {
          starSpeed = 0; // Minimum speed limit
          speedIncrement = 0;
        }
  
        // Update circle size
        const scale = 1 + 0.3 * (starSpeed / maxStarSpeed); // scale from 1.5 to 1
        circle.style.transform = `scale(${scale})`;
  
        // Stop pulsating effect if active
        if (pulsating) {
          stopPulsating();
        }
      }
  
      // Update background color based on starSpeed
      const progress = starSpeed / maxStarSpeed; // value from 0 to 1
      const blueComponent = Math.round(25 * (1 - progress)); // decreasing from 25 to 0
      const hexBlue = blueComponent.toString(16).padStart(2, '0');
      const color = `#0000${hexBlue}`;
      body.style.backgroundColor = color;
  
      requestAnimationFrame(updateStarSpeed);
    }
  
    updateStarSpeed();
  });
  