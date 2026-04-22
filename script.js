document.addEventListener('DOMContentLoaded', () => {
    const paletteContainer = document.getElementById('palette-container');
    const paletteWrapper = document.querySelector('.palette-wrapper');
    const viewToggleBtn = document.getElementById('view-toggle');
    const stepSlider = document.getElementById('step-slider');
    const stepLabel = document.getElementById('step-label');
    
    
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-modal');

    
    const modeDropdown = document.getElementById('mode-dropdown');
    const modeSelected = document.getElementById('dropdown-selected');
    const modeTextSpan = modeSelected.querySelector('span');
    const modeOptionsList = modeDropdown.querySelectorAll('.dropdown-option');
    let currentMode = 'both';

    
    const copyDropdown = document.getElementById('copy-dropdown');
    const copySelected = document.getElementById('copy-selected');
    const copyTextSpan = document.getElementById('copy-text');
    const copyOptionsList = copyDropdown.querySelectorAll('.dropdown-option');

    
    closeModalBtn.addEventListener('click', () => {
        infoModal.classList.add('hidden');
    });

    
    modeSelected.addEventListener('click', () => {
        modeDropdown.classList.toggle('open');
    });

    modeOptionsList.forEach(option => {
        option.addEventListener('click', () => {
            modeTextSpan.textContent = option.textContent;
            modeOptionsList.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            currentMode = option.dataset.value;
            modeDropdown.classList.remove('open');
            renderPalette(colorPicker.color.rgb);
        });
    });

    // --- API ---
    copySelected.addEventListener('click', () => {
        copyDropdown.classList.toggle('open');
    });

    copyOptionsList.forEach(option => {
        option.addEventListener('click', async () => {
            const format = option.dataset.format; 
            copyDropdown.classList.remove('open');
            
            const cards = document.querySelectorAll('.color-card');
            const originalText = "COPY ALL COLOURS!";

            if (format === 'hex') {
                const hexArray = Array.from(cards).map(card => card.dataset.hex);
                const copyString = hexArray.join(', ');
                
                navigator.clipboard.writeText(copyString).then(() => {
                    copySelected.style.backgroundColor = "rgb(40, 167, 69)"; 
                    copySelected.style.borderColor = "rgb(40, 167, 69)";
                    copyTextSpan.textContent = "✓ COPIED HEX!";
                    
                    setTimeout(() => {
                        copySelected.style.backgroundColor = ""; 
                        copySelected.style.borderColor = "";
                        copyTextSpan.textContent = originalText;
                    }, 2000);
                });

            } else if (format === 'css') {
                copySelected.style.backgroundColor = "rgb(234, 182, 10)"; 
                copySelected.style.borderColor = "rgb(234, 182, 10)";
                copySelected.style.color = "black";
                copyTextSpan.textContent = "GENERATING NAMES...";

                try {
                    const nameCounts = {};
                    
                    const fetches = Array.from(cards).map(async (card) => {
                        const hexValue = card.dataset.hex.replace('#', ''); 
                        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hexValue}`);
                        const data = await response.json();
                        
                        let colorName = data.name.value.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        
                        if (nameCounts[colorName]) {
                            nameCounts[colorName]++;
                            colorName = `${colorName}-${nameCounts[colorName]}`;
                        } else {
                            nameCounts[colorName] = 1;
                        }

                        return `--${colorName}: #${hexValue.toUpperCase()};`;
                    });

                    const cssArray = await Promise.all(fetches);
                    const copyString = cssArray.join('\n');

                    await navigator.clipboard.writeText(copyString);
                    
                    copySelected.style.backgroundColor = "rgb(40, 167, 69)"; 
                    copySelected.style.borderColor = "rgb(40, 167, 69)";
                    copySelected.style.color = "white";
                    copyTextSpan.textContent = "✓ COPIED CSS!";

                } catch (error) {
                    copySelected.style.backgroundColor = "black"; 
                    copyTextSpan.textContent = "[CONNECTION ERROR]";
                    copySelected.style.color = "white";
                }

                setTimeout(() => {
                    copySelected.style.backgroundColor = ""; 
                    copySelected.style.borderColor = "";
                    copySelected.style.color = "";
                    copyTextSpan.textContent = originalText;
                }, 2500);
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (!modeDropdown.contains(event.target)) {
            modeDropdown.classList.remove('open');
        }
        if (!copyDropdown.contains(event.target)) {
            copyDropdown.classList.remove('open');
        }
    });

    
  
  
    const colorPicker = new iro.ColorPicker("#iro-picker", {
        width: 200,      
        color: "#008080", 
        borderWidth: 3,
        borderColor: "#000",
        layout: [
            { component: iro.ui.Box },
            { component: iro.ui.Slider, options: { sliderType: 'hue' } }
        ]
    });

  
  
  
    function rgbToHex(r, g, b) {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
    }

    function getTint(r, g, b, factor) {
        return {
            r: Math.round(r + (255 - r) * factor),
            g: Math.round(g + (255 - g) * factor),
            b: Math.round(b + (255 - b) * factor)
        };
    }

    function getShade(r, g, b, factor) {
        return {
            r: Math.round(r * (1 - factor)),
            g: Math.round(g * (1 - factor)),
            b: Math.round(b * (1 - factor))
        };
    }

   
    function calculateShades(rgbObj) {
        const { r, g, b } = rgbObj;
        const baseHex = rgbToHex(r, g, b);
        const shadesArray = [];
        
        const stepSize = parseInt(stepSlider.value, 10) / 100;

        if (currentMode === 'both') {
            
            for (let i = 4; i >= 1; i--) {
                let factor = Math.min(stepSize * i, 1); 
                const tint = getTint(r, g, b, factor);
                shadesArray.push({ ...tint, hex: rgbToHex(tint.r, tint.g, tint.b) });
            }
            
        shadesArray.push({ r, g, b, hex: baseHex }); 
            
           
            for (let i = 1; i <= 4; i++) {
                let factor = Math.min(stepSize * i, 1); 
                const shade = getShade(r, g, b, factor);
                shadesArray.push({ ...shade, hex: rgbToHex(shade.r, shade.g, shade.b) });
            }
        } else if (currentMode === 'tints') {
            // BASE IS NOW CARD #1
            shadesArray.push({ r, g, b, hex: baseHex });
            
            for (let i = 1; i <= 8; i++) {
                let factor = Math.min(stepSize * i, 1);
                const tint = getTint(r, g, b, factor);
                shadesArray.push({ ...tint, hex: rgbToHex(tint.r, tint.g, tint.b) });
            }
        } else if (currentMode === 'shades') {
            // BASE IS NOW CARD #1
            shadesArray.push({ r, g, b, hex: baseHex });
            
            for (let i = 1; i <= 8; i++) {
                let factor = Math.min(stepSize * i, 1);
                const shade = getShade(r, g, b, factor);
                shadesArray.push({ ...shade, hex: rgbToHex(shade.r, shade.g, shade.b) });
            }
        }

        return shadesArray;
    }

    
    function createColorCard(colorObj) {
        const card = document.createElement('div');
        card.className = 'color-card is-entering'; 
        card.style.backgroundColor = colorObj.hex;
        card.dataset.hex = colorObj.hex; 
        card.title = "Click to copy HEX!";
        
        const copiedText = document.createElement('div');
        copiedText.className = 'copied-text';
        copiedText.textContent = 'COPIED';
        card.appendChild(copiedText);

        const info = document.createElement('div');
        info.className = 'color-info';
        
        const hexText = document.createElement('span');
        hexText.className = 'hex-text';
        hexText.textContent = `HEX: ${colorObj.hex}`;
        
        const rgbText = document.createElement('span');
        rgbText.className = 'rgb-text';
        rgbText.textContent = `RGB: (${colorObj.r}, ${colorObj.g}, ${colorObj.b})`;
        
        info.appendChild(hexText);
        info.appendChild(rgbText);
        card.appendChild(info);

        card.addEventListener('click', () => {
            const currentHex = card.dataset.hex; 
            
            card.classList.remove('clicked', 'just-copied'); 
            void card.offsetWidth; 
            card.classList.add('clicked', 'just-copied');
            
            setTimeout(() => {
                card.classList.remove('just-copied'); 
            }, 1000); 

            navigator.clipboard.writeText(currentHex);
        });

        return card;
    }

    
    function updateCenterCard() {
        if (!paletteContainer.classList.contains('slider-mode')) return;

        const cards = document.querySelectorAll('.color-card');
        if (cards.length === 0) return;

        const containerCenter = window.innerWidth / 2;
        let closestCard = null;
        let closestDistance = Infinity;

        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + (rect.width / 2);
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = card;
            }
        });

        cards.forEach(card => card.classList.remove('center-focus'));
        if (closestCard) {
            closestCard.classList.add('center-focus');
        }
    }

    paletteContainer.addEventListener('scroll', updateCenterCard);
    window.addEventListener('resize', updateCenterCard);

  
    function renderPalette(rgbObj) {
        const existingCards = paletteContainer.querySelectorAll('.color-card');
        const generatedShades = calculateShades(rgbObj);
        
        if (existingCards.length === 9) {
            existingCards.forEach((card, i) => {
                const newColor = generatedShades[i];
                card.style.backgroundColor = newColor.hex;
                card.dataset.hex = newColor.hex; 
                
                const hexText = card.querySelector('.hex-text');
                const rgbText = card.querySelector('.rgb-text');
                
                hexText.textContent = `HEX: ${newColor.hex}`;
                rgbText.textContent = `RGB: (${newColor.r}, ${newColor.g}, ${newColor.b})`;
            });
        } else {
            paletteContainer.innerHTML = '';
            const newCardsArray = [];
            
            generatedShades.forEach((colorObj) => {
                const newCard = createColorCard(colorObj);
                paletteContainer.appendChild(newCard);
                newCardsArray.push(newCard);
            });
            
            setTimeout(() => {
                newCardsArray.forEach((card, i) => {
                    setTimeout(() => {
                        card.classList.remove('is-entering');
                    }, i * 50); 
                });
                updateCenterCard();
            }, 10);
        }
    }

    
    colorPicker.on('color:change', function(color) {
        renderPalette(color.rgb);
    });

    stepSlider.addEventListener('input', (event) => {
        stepLabel.textContent = `STEP GAP: ${event.target.value}%`;
        renderPalette(colorPicker.color.rgb);
    });

    viewToggleBtn.addEventListener('click', () => {
        paletteWrapper.classList.add('fading');
        
        setTimeout(() => {
            paletteContainer.classList.toggle('slider-mode');
            
            if (paletteContainer.classList.contains('slider-mode')) {
                viewToggleBtn.textContent = 'VIEW: GRID';
                updateCenterCard();
            } else {
                viewToggleBtn.textContent = 'VIEW: SLIDER';
                document.querySelectorAll('.color-card').forEach(c => c.classList.remove('center-focus'));
            }
            
            paletteWrapper.classList.remove('fading');
        }, 300); 
    });

    
  
    renderPalette(colorPicker.color.rgb);
});
