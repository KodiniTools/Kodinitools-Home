// textManager.js

/**
 * Enhanced TextManager - manages text objects, font changes, and text-related UI
 */
export class TextManager {
    constructor(fontManager, redrawCallback, uiUpdateCallback) {
        this.textObjects = [];
        this.activeObject = null;
        this.fontManager = fontManager;
        this.redrawCallback = redrawCallback;
        this.uiUpdateCallback = uiUpdateCallback;
        this.defaultFont = 'Supreme Regular';
    }

    /**
     * Sets up text-related UI event listeners
     */
    setupUIHandlers(elements) {
        const {
            textInput,
            addTextBtn,
            fontSelect,
            textColorInput,
            fontSizeInput,
            textOpacityInput,
            shadowColorInput,
            shadowBlurInput,
            shadowXInput,
            shadowYInput
        } = elements;

        // Font select population
        if (fontSelect && this.fontManager) {
            this.fontManager.populateFontSelect(fontSelect);
        }

        // Add text handler
        if (addTextBtn && textInput) {
            addTextBtn.addEventListener('click', () => {
                if (textInput.value.trim()) {
                    this.add(textInput.value.trim());
                    textInput.value = '';
                    this.redrawCallback?.();
                    this.uiUpdateCallback?.();
                }
            });
        }

        // Font change handler with proper loading
        if (fontSelect) {
            fontSelect.addEventListener('change', async (e) => {
                const newFontFamily = e.target.value;
                
                if (this.activeObject && this.activeObject.type === 'text') {
                    // Wait for font to be ready
                    const isReady = await this.fontManager.waitForFont(newFontFamily);
                    
                    if (isReady) {
                        this.updateActiveProperty('fontFamily', newFontFamily);
                    } else {
                        console.warn(`Font ${newFontFamily} not available, keeping current font`);
                        // Reset select to current font
                        fontSelect.value = this.activeObject.fontFamily;
                    }
                }
            });
        }

        // Other property change handlers
        if (textColorInput) {
            textColorInput.addEventListener('input', (e) => {
                this.updateActiveProperty('color', e.target.value);
            });
        }

        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', (e) => {
                this.updateActiveProperty('relSize', e.target.value / 1080);
            });
        }

        if (textOpacityInput) {
            textOpacityInput.addEventListener('input', (e) => {
                this.updateActiveProperty('opacity', parseFloat(e.target.value));
            });
        }

        if (shadowColorInput) {
            shadowColorInput.addEventListener('input', (e) => {
                this.updateActiveProperty('shadow.color', e.target.value);
            });
        }

        if (shadowBlurInput) {
            shadowBlurInput.addEventListener('input', (e) => {
                this.updateActiveProperty('shadow.blur', parseInt(e.target.value, 10));
            });
        }

        if (shadowXInput) {
            shadowXInput.addEventListener('input', (e) => {
                this.updateActiveProperty('shadow.offsetX', parseInt(e.target.value, 10));
            });
        }

        if (shadowYInput) {
            shadowYInput.addEventListener('input', (e) => {
                this.updateActiveProperty('shadow.offsetY', parseInt(e.target.value, 10));
            });
        }
    }

    /**
     * Adds a new text object to the manager.
     */
    add(text, options = {}) {
        const newTextObject = {
            id: Date.now(),
            type: 'text',
            text: text,
            relX: options.relX || 0.5,
            relY: options.relY || 0.5,
            fontFamily: options.fontFamily || this.defaultFont,
            relSize: (options.size || 80) / 1080,
            color: options.color || '#FFFFFF',
            opacity: options.opacity || 1.0,
            shadow: {
                color: '#000000', 
                blur: 10, 
                offsetX: 2, 
                offsetY: 2, 
                ...options.shadow
            },
        };
        
        this.textObjects.push(newTextObject);
        this.setActiveObject(newTextObject);
        return newTextObject;
    }

    /**
     * Sets the active text object and updates UI controls
     */
    setActiveObject(textObject) {
        this.activeObject = textObject;
        this.updateUIControls();
    }

    /**
     * Updates UI controls to reflect the active object's properties
     */
    updateUIControls() {
        if (!this.activeObject || this.activeObject.type !== 'text') {
            this.disableTextControls();
            return;
        }

        this.enableTextControls();

        // Update all control values
        const obj = this.activeObject;
        this.updateControlValue('fontSelect', obj.fontFamily);
        this.updateControlValue('textColorInput', obj.color);
        this.updateControlValue('fontSizeInput', obj.relSize * 1080);
        this.updateControlValue('textOpacityInput', obj.opacity);
        this.updateControlValue('shadowColorInput', obj.shadow.color);
        this.updateControlValue('shadowBlurInput', obj.shadow.blur);
        this.updateControlValue('shadowXInput', obj.shadow.offsetX);
        this.updateControlValue('shadowYInput', obj.shadow.offsetY);
    }

    /**
     * Helper to update a control value by ID
     */
    updateControlValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    /**
     * Enable text controls
     */
    enableTextControls() {
        const controls = ['fontSelect', 'textColorInput', 'fontSizeInput', 'textOpacityInput', 
                         'shadowColorInput', 'shadowBlurInput', 'shadowXInput', 'shadowYInput'];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.disabled = false;
        });
    }

    /**
     * Disable text controls
     */
    disableTextControls() {
        const controls = ['fontSelect', 'textColorInput', 'fontSizeInput', 'textOpacityInput', 
                         'shadowColorInput', 'shadowBlurInput', 'shadowXInput', 'shadowYInput'];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.disabled = true;
        });
    }

    /**
     * Updates a property of the active text object
     */
    updateActiveProperty(propertyPath, value) {
        if (!this.activeObject || this.activeObject.type !== 'text') return;

        // Handle nested properties like 'shadow.color'
        const parts = propertyPath.split('.');
        let obj = this.activeObject;
        
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }
        
        obj[parts[parts.length - 1]] = value;
        
        // Trigger redraw with small delay to ensure font is loaded
        setTimeout(() => {
            this.redrawCallback?.();
        }, 50);
    }

    /**
     * Removes a text object from the manager.
     */
    delete(objectToDelete) {
        this.textObjects = this.textObjects.filter(obj => obj.id !== objectToDelete.id);
        
        if (this.activeObject === objectToDelete) {
            this.activeObject = null;
            this.disableTextControls();
        }
    }

    /**
     * Clears all text objects
     */
    clear() {
        this.textObjects = [];
        this.activeObject = null;
        this.disableTextControls();
    }
    
    /**
     * Draws all text objects onto the given canvas context.
     */
    drawAll(ctx) {
        const targetCanvas = ctx.canvas;
        
        this.textObjects.forEach(textObj => {
            if (!textObj.text) return;

            const scaleFactor = targetCanvas.height / 1080;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = textObj.shadow.color;
            ctx.shadowBlur = textObj.shadow.blur * scaleFactor;
            ctx.shadowOffsetX = textObj.shadow.offsetX * scaleFactor;
            ctx.shadowOffsetY = textObj.shadow.offsetY * scaleFactor;

            const size = textObj.relSize * targetCanvas.height;
            const x = textObj.relX * targetCanvas.width;
            const y = textObj.relY * targetCanvas.height;
            
            // Ensure font is properly formatted
            ctx.font = `bold ${size}px "${textObj.fontFamily}"`;
            ctx.fillStyle = this.hexToRgba(textObj.color, textObj.opacity);

            const textLines = textObj.text.split('\n');
            const lineHeight = size * 1.2;
            const totalTextHeight = (textLines.length - 1) * lineHeight;
            const startY = y - totalTextHeight / 2;

            textLines.forEach((textLine, index) => {
                const currentY = startY + (index * lineHeight);
                ctx.fillText(textLine, x, currentY);
            });
        });
        
        // Reset shadow for other drawing operations
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    /**
     * Calculates the bounding box for a given text object.
     */
    getObjectBounds(obj, targetCanvas) {
        if (!obj || !obj.text) return null;

        const size = obj.relSize * targetCanvas.height;
        const ctx = targetCanvas.getContext('2d');
        ctx.font = `bold ${size}px "${obj.fontFamily}"`;

        const textLines = obj.text.split('\n');
        const lineHeight = size * 1.2;
        const totalTextHeight = (textLines.length) * lineHeight - (lineHeight - size);

        let maxWidth = 0;
        textLines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxWidth) maxWidth = metrics.width;
        });

        const absX = obj.relX * targetCanvas.width;
        const absY = obj.relY * targetCanvas.height;

        return {
            x: absX - maxWidth / 2,
            y: absY - totalTextHeight / 2,
            width: maxWidth,
            height: totalTextHeight
        };
    }
    
    /**
     * Finds the top-most text object at a given canvas coordinate.
     */
    findObjectAt(x, y, targetCanvas) {
        for (let i = this.textObjects.length - 1; i >= 0; i--) {
            const obj = this.textObjects[i];
            const bounds = this.getObjectBounds(obj, targetCanvas);
            if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && 
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return obj;
            }
        }
        return null;
    }

    /**
     * Get all text objects
     */
    getAllObjects() {
        return [...this.textObjects];
    }

    /**
     * Get the active object
     */
    getActiveObject() {
        return this.activeObject;
    }

    // Helper function to convert hex to rgba
    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return `rgba(${+r},${+g},${+b},${alpha})`;
    }
}