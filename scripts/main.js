document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const items = ['1.png', '2.png', '3.png', '4.png', '5.png'];
    const itemIndexes = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 };
    let mergeCount = 0;
    let tutorialStep = 0;
    let tutorialActive = true;

    const mergeSound = document.getElementById('merge-sound');
    const dropSound = document.getElementById('drop-sound');
    const popupSound = document.getElementById('popup-sound');

    const createGridItems = () => {
        for (let i = 0; i < 24; i++) {
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            gridItem.addEventListener('mousedown', dragStart);
            gridItem.addEventListener('touchstart', dragStart, { passive: false });
            gridContainer.appendChild(gridItem);
        }
    };

    const placeRandomItems = () => {
        const gridItems = document.querySelectorAll('.grid-item');
        const placedIndexes = [];

        const guaranteedItem = items[Math.floor(Math.random() * items.length)];
        let guaranteedIndexes = [];
        while (guaranteedIndexes.length < 2) {
            const randomIndex = Math.floor(Math.random() * 24);
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
            const randomIndex = Math.floor(Math.random() * 24);
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
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'scale(0) rotate(180deg)';
            setTimeout(() => {
                element.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                element.style.opacity = '1';
                element.style.transform = 'scale(1) rotate(0deg)';
            }, 50);
        }
    };

    let draggedElement = null;
    let offsetX = 0;
    let offsetY = 0;

    const dragStart = (e) => {
        e.preventDefault();
        const gridItem = e.target.closest('.grid-item');
        if (!gridItem || !gridItem.querySelector('img')) return;

        const imgElement = gridItem.querySelector('img');
        draggedElement = imgElement.cloneNode(true);
        draggedElement.classList.add('dragging-clone');
        draggedElement.style.position = 'absolute';
        draggedElement.style.width = `${imgElement.clientWidth}px`;
        draggedElement.style.height = `${imgElement.clientHeight}px`;
        draggedElement.style.transition = 'none';
        draggedElement.style.transform = 'none';
        draggedElement.style.opacity = '1';
        document.body.appendChild(draggedElement);

        const rect = imgElement.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        updateElementPosition(clientX, clientY);
        imgElement.classList.add('dragging');
        gridItem.dataset.dragType = imgElement.dataset.type;
        gridItem.dataset.dragHTML = imgElement.outerHTML;

        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', drop);
        } else if (e.type === 'touchstart') {
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', drop);
        }
    };

    const updateElementPosition = (clientX, clientY) => {
        if (!draggedElement) return;
        draggedElement.style.left = `${clientX - offsetX}px`;
        draggedElement.style.top = `${clientY - offsetY}px`;
    };

    const drag = (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        updateElementPosition(clientX, clientY);
    };

    const drop = (e) => {
        if (!draggedElement) return;
        e.preventDefault();

        const clientX = e.clientX || e.changedTouches[0].clientX;
        const clientY = e.clientY || e.changedTouches[0].clientY;
        const targetElement = document.elementFromPoint(clientX, clientY);
        const targetGridItem = targetElement ? targetElement.closest('.grid-item') : null;

        document.body.removeChild(draggedElement);

        const originalElement = document.querySelector('.dragging');
        if (originalElement) {
            originalElement.classList.remove('dragging');
        }

        if (targetGridItem && targetGridItem !== originalElement.parentElement) {
            handleDrop(targetGridItem, originalElement);
        } else {
            originalElement.parentElement.appendChild(originalElement);
        }

        draggedElement = null;

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', drop);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', drop);
    };

    const handleDrop = (target, draggedImg) => {
        const targetImg = target.querySelector('img');
        const targetType = targetImg ? targetImg.dataset.type : null;
        const draggedType = draggedImg.dataset.type;

        if (targetType && targetType === draggedType) {
            mergeItems(target, draggedType);
            draggedImg.parentElement.innerHTML = '';
        } else if (!targetType) {
            target.appendChild(draggedImg);
            animateEntrance(draggedImg);
            dropSound.play();
        } else {
            draggedImg.parentElement.appendChild(draggedImg);
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
        updateMergeCount(newItemType);
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

    let characterLevel = 0;
    const maxCharacterLevel = 2;

    const updateMergeCount = (newItemType) => {
        mergeCount++;
        const mergeCountElement = document.getElementById('merge-count');
        if (mergeCountElement) {
            mergeCountElement.textContent = mergeCount;

            // Her 5 birleşmede karakter seviyesini artır
            if (mergeCount % 2 === 0 && characterLevel < maxCharacterLevel) {
                upgradeCharacter();
            }
        }
    };

    const upgradeCharacter = () => {
        if (characterLevel < maxCharacterLevel) {
            characterLevel++;
            changeAnchoredImageAfterMerge(characterLevel);
            showLevelUpAnimation();

            if (characterLevel === maxCharacterLevel) {
                showPopup();
            }
        }
    };

    const changeAnchoredImageAfterMerge = (level) => {
        const anchoredImage = document.querySelector('.anchored-image');
        if (anchoredImage) {
            anchoredImage.src = `images/Character${level}.png`;
     
        }
    };

    const showLevelUpAnimation = () => {
        const anchoredImage = document.querySelector('.anchored-image');
        anchoredImage.classList.add('upgrade-animation');
        setTimeout(() => {
            anchoredImage.classList.remove('upgrade-animation');
        }, 300); // Duration of the punch animation
    };

    const showPopup = () => {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.style.display = 'block';
            popupSound.play();

            const closeButton = document.getElementById('close-popup');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    popup.style.display = 'none';
                });
            }

            const downloadLink = document.getElementById('download-link');
            if (downloadLink) {
                downloadLink.addEventListener('click', () => {
                    window.location.href = 'https://apps.apple.com/us/app/farm-connect-match-3d-puzzle/id6503044105';
                });
            }
        }
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

        if (!hand) return;

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
