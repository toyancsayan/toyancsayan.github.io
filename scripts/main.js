document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const items = ['1.png', '2.png', '3.png', '4.png', '5.png'];
    let mergeCount = 0;
    let tutorialStep = 0;
    let tutorialActive = true;

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
            gridItem.addEventListener('touchstart', touchStart, { passive: false });
            gridItem.addEventListener('touchmove', touchMove, { passive: false });
            gridItem.addEventListener('touchend', touchEnd, { passive: false });
            gridContainer.appendChild(gridItem);
        }
    };

    const placeRandomItems = () => {
        const gridItems = document.querySelectorAll('.grid-item');
        const placedIndexes = [];

        // Ensure we place at least one pair of identical items
        const guaranteedItem = items[Math.floor(Math.random() * items.length)];
        let guaranteedIndexes = [];
        while (guaranteedIndexes.length < 2) {
            const randomIndex = Math.floor(Math.random() * 25);
            if (!guaranteedIndexes.includes(randomIndex)) {
                guaranteedIndexes.push(randomIndex);
            }
        }

        for (let index of guaranteedIndexes) {
            const img = document.createElement('img');
            img.src = `images/${guaranteedItem}`;
            img.dataset.type = guaranteedItem.split('.')[0];
            gridItems[index].appendChild(img);
            animateEntrance(img);
            placedIndexes.push(index);
        }

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
        handleDrop(e, e.dataTransfer.getData('text/plain'), e.dataTransfer.getData('text/html'));
    };

    const handleDrop = (e, draggedItemType, draggedItemHTML) => {
        const target = e.target.closest('.grid-item');
        target.classList.remove('drag-over');

        const targetImg = target.querySelector('img');
        const targetType = targetImg ? targetImg.dataset.type : null;

        const draggingElement = document.querySelector('.dragging');
        const originalParent = draggingElement ? draggingElement.parentElement : null;

        if (target === originalParent) {
            if (draggingElement) {
                draggingElement.classList.remove('dragging');
            }
            return;
        }

        if (targetType && targetType === draggedItemType) {
            mergeItems(target, draggedItemType);
            if (originalParent) {
                originalParent.innerHTML = '';
            }
        } else if (!targetType) {
            target.innerHTML = draggedItemHTML;
            const newImg = target.querySelector('img');
            animateEntrance(newImg);
            dropSound.play();
            if (originalParent) {
                originalParent.innerHTML = '';
            }
        } else {
            if (originalParent) {
                originalParent.innerHTML = draggedItemHTML;
                const originalImg = originalParent.querySelector('img');
                animateEntrance(originalImg);
            }
        }

        if (draggingElement) {
            draggingElement.classList.remove('dragging');
        }

        if (tutorialActive) {
            tutorialStep++;
            if (tutorialStep === 1) {
                setTimeout(() => {
                    animateTutorialHand();
                }, 1000);
            } else if (tutorialStep > 1) {
                tutorialActive = false;
                document.getElementById('tutorial-hand').remove();
            }
        }
    };

    let touchDragElement = null;
    let offsetX = 0;
    let offsetY = 0;

    const touchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY).closest('.grid-item');
        const imgElement = target.querySelector('img');
        if (imgElement) {
            touchDragElement = imgElement.cloneNode(true);
            touchDragElement.classList.add('dragging-clone');
            touchDragElement.style.position = 'absolute';
            touchDragElement.style.width = `${imgElement.clientWidth}px`;
            touchDragElement.style.height = `${imgElement.clientHeight}px`;

            touchDragElement.style.transition = 'none';
            touchDragElement.style.transform = 'none';
            touchDragElement.style.opacity = '1';

            document.body.appendChild(touchDragElement);

            const rect = imgElement.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;

            moveElementToTouch(touchDragElement, touch.pageX, touch.pageY);

            imgElement.classList.add('dragging');
            target.dataset.touchType = imgElement.dataset.type;
            target.dataset.touchHTML = imgElement.outerHTML;
        }
    };

    const touchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touchDragElement) {
            moveElementToTouch(touchDragElement, touch.pageX, touch.pageY);
        }
    };

    const touchEnd = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY).closest('.grid-item');
        const draggingElement = document.querySelector('.dragging');

        if (target && draggingElement) {
            const draggedItemType = draggingElement.dataset.type;
            const draggedItemHTML = draggingElement.outerHTML;
            handleDrop({ target: target }, draggedItemType, draggedItemHTML);
            draggingElement.classList.remove('dragging');
        }
        if (touchDragElement) {
            document.body.removeChild(touchDragElement);
            touchDragElement = null;
        }
    };

    const moveElementToTouch = (element, x, y) => {
        element.style.left = `${x - offsetX}px`;
        element.style.top = `${y - offsetY}px`;
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
        popupSound.play();
        const closeButton = document.getElementById('close-popup');
        closeButton.addEventListener('click', () => {
            popup.style.display = 'none';
        });
        const downloadLink = document.getElementById('download-link');
        downloadLink.addEventListener('click', () => {
            window.location.href = 'https://apps.apple.com/us/app/farm-connect-match-3d-puzzle/id6503044105';
        });
    };

    const createTutorial = () => {
        const tutorialHand = document.createElement('img');
        tutorialHand.src = 'images/hand.png';
        tutorialHand.id = 'tutorial-hand';
        tutorialHand.style.width = '150px';
        tutorialHand.style.height = 'auto';
        tutorialHand.style.position = 'absolute';
        tutorialHand.style.zIndex = '1001';
        tutorialHand.style.transition = 'all 1s ease-in-out';
        tutorialHand.style.opacity = '0';
        tutorialHand.style.pointerEvents = 'none'; // Ensure the hand doesn't block mouse events

        document.body.appendChild(tutorialHand);

        setTimeout(() => {
            const gridItems = document.querySelectorAll('.grid-item img');
            if (gridItems.length > 0) {
                animateTutorialHand();
            }
        }, 3000);
    };

    const animateTutorialHand = () => {
        const hand = document.getElementById('tutorial-hand');
        const gridItems = document.querySelectorAll('.grid-item img');
        let startItem, endItem;

        // Find two identical items
        for (let i = 0; i < gridItems.length; i++) {
            for (let j = i + 1; j < gridItems.length; j++) {
                if (gridItems[i].src === gridItems[j].src) {
                    startItem = gridItems[i].parentElement;
                    endItem = gridItems[j].parentElement;
                    break;
                }
            }
            if (startItem) break;
        }

        if (startItem && endItem) {
            const startRect = startItem.getBoundingClientRect();
            const endRect = endItem.getBoundingClientRect();

            // Instantly position hand at the start item
            hand.style.transition = 'none';
            hand.style.left = `${startRect.left + startRect.width / 2 - 25}px`;
            hand.style.top = `${startRect.top + startRect.height / 2 - 25}px`;
            hand.style.opacity = '1';

            // Allow transition for movement to end item
            setTimeout(() => {
                hand.style.transition = 'all 1s ease-in-out';
                hand.style.left = `${endRect.left + endRect.width / 2 - 25}px`;
                hand.style.top = `${endRect.top + endRect.height / 2 - 25}px`;
            }, 100);

            // Restart animation
            setTimeout(() => {
                hand.style.opacity = '0';
                setTimeout(() => {
                    animateTutorialHand();
                }, 1000);
            }, 1500);
        } else {
            // Retry if no matching items found
            setTimeout(() => {
                animateTutorialHand();
            }, 1000);
        }
    };

    createGridItems();
    placeRandomItems();
    createTutorial();
});
