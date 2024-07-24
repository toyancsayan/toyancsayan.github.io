document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const items = ['1.png', '2.png', '3.png', '4.png', '5.png'];
    let mergeCount = 0;

    const mergeSound = document.getElementById('merge-sound');
    const dropSound = document.getElementById('drop-sound');
    const popupSound = document.getElementById('popup-sound');
    const confettiSound = document.getElementById('confetti-sound');

    const createGridItems = () => {
        for (let i = 0; i < 25; i++) {
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.setAttribute('draggable', true);
            gridItem.addEventListener('dragstart', dragStart);
            gridItem.addEventListener('dragover', dragOver);
            gridItem.addEventListener('drop', drop);
            gridContainer.appendChild(gridItem);
        }
    };

    const placeRandomItems = () => {
        const gridItems = document.querySelectorAll('.grid-item');
        const placedIndexes = [];
        while (placedIndexes.length < 10) {
            const randomIndex = Math.floor(Math.random() * 25);
            if (!placedIndexes.includes(randomIndex)) {
                placedIndexes.push(randomIndex);
                const img = document.createElement('img');
                img.src = `images/${items[Math.floor(Math.random() * items.length)]}`;
                img.dataset.type = img.src.split('/').pop().split('.')[0];
                gridItems[randomIndex].appendChild(img);
                animateEntrance(img);
            }
        }
    };

    const animateEntrance = (element) => {
        element.style.opacity = '0';
        element.style.transform = 'scale(0) rotate(180deg)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            element.style.opacity = '1';
            element.style.transform = 'scale(1) rotate(0deg)';
        }, 50);
    };

    const dragStart = (e) => {
        const imgElement = e.target.querySelector('img');
        if (imgElement) {
            e.dataTransfer.setData('text/plain', imgElement.dataset.type);
            e.dataTransfer.setData('text/html', imgElement.outerHTML);
            imgElement.classList.add('dragging');
        }
    };

    const dragOver = (e) => {
        e.preventDefault();
        e.target.closest('.grid-item').classList.add('drag-over');
    };

    const drop = (e) => {
        e.preventDefault();
        const target = e.target.closest('.grid-item');
        target.classList.remove('drag-over');

        const draggedItemType = e.dataTransfer.getData('text/plain');
        const draggedItemHTML = e.dataTransfer.getData('text/html');

        const targetImg = target.querySelector('img');
        const targetType = targetImg ? targetImg.dataset.type : null;

        const draggingElement = document.querySelector('.dragging');
        const originalParent = draggingElement ? draggingElement.parentElement : null;

        // Check if the target is the same as the original parent
        if (target === originalParent) {
            if (draggingElement) {
                draggingElement.classList.remove('dragging');
            }
            return; // Do nothing if the item is dropped onto itself
        }

        if (targetType && targetType === draggedItemType) {
            mergeItems(target, draggedItemType);
            // Clear the original position
            if (originalParent) {
                originalParent.innerHTML = '';
            }
        } else if (!targetType) {
            target.innerHTML = draggedItemHTML;
            const newImg = target.querySelector('img');
            animateEntrance(newImg);
            // Play drop sound
            dropSound.play();
            // Clear the original position
            if (originalParent) {
                originalParent.innerHTML = '';
            }
        } else {
            // Return the dragged item to its original position
            if (originalParent) {
                originalParent.innerHTML = draggedItemHTML;
                const originalImg = originalParent.querySelector('img');
                animateEntrance(originalImg);
            }
        }

        // Clear the dragging class
        if (draggingElement) {
            draggingElement.classList.remove('dragging');
        }
    };

    const mergeItems = (target, itemType) => {
        const newItemType = getNextItem(itemType);
        const newImg = document.createElement('img');
        newImg.src = `images/${newItemType}.png`;
        newImg.dataset.type = newItemType;
        target.innerHTML = '';
        target.appendChild(newImg);
        animateEntrance(newImg);
        createMergeParticles(target);
        updateMergeCount();
        // Play merge sound
        mergeSound.play();
    };

    const getNextItem = (currentType) => {
        const currentIndex = items.findIndex(item => item.includes(currentType));
        return items[(currentIndex + 1) % items.length].split('.')[0];
    };

    const createMergeParticles = (target) => {
        const rect = target.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.id = 'merge-particles';
        canvas.style.position = 'absolute';
        canvas.style.left = `${rect.left}px`;
        canvas.style.top = `${rect.top}px`;
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1000';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = 30;

        class Particle {
            constructor() {
                this.x = canvas.width / 2;
                this.y = canvas.height / 2;
                this.radius = Math.random() * 3 + 1;
                this.color = ['#FFD700', '#FF6347', '#4682B4'][Math.floor(Math.random() * 3)];
                this.velocity = {
                    x: (Math.random() - 0.5) * 3,
                    y: (Math.random() - 0.5) * 3
                };
                this.opacity = 1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.fill();
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.opacity -= 0.02;
                if (this.opacity <= 0) {
                    this.opacity = 0;
                }
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((particle, index) => {
                if (particle.opacity > 0) {
                    particle.update();
                    particle.draw();
                } else {
                    particles.splice(index, 1);
                }
            });
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }

        animate();
    };

    const updateMergeCount = () => {
        mergeCount++;
        document.getElementById('merge-count').textContent = mergeCount;
        if (mergeCount === 5) {
            showPopup();
        }
    };

    const showPopup = () => {
        const popup = document.getElementById('popup');
        popup.style.display = 'block';
        // Play popup sound
        popupSound.play();

        // Add confetti effect
        createConfetti();

        // Close button event listener
        const closeButton = document.getElementById('close-popup');
        closeButton.addEventListener('click', () => {
            popup.style.display = 'none';
        });

        // Redirect on click
        const downloadLink = document.getElementById('download-link');
        downloadLink.addEventListener('click', () => {
            window.location.href = 'https://apps.apple.com/us/app/farm-connect-match-3d-puzzle/id6503044105';
        });
    };

    // New function to create confetti effect
    const createConfetti = () => {
        const confettiCount = 100;
        const colors = ['#FFD700', '#FF6347', '#4682B4', '#32CD32', '#FF69B4'];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            document.body.appendChild(confetti);
        };
        // Play confetti sound
        confettiSound.play();
    };

    createGridItems();
    placeRandomItems();
});
