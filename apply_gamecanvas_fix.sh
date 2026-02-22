#!/bin/bash
# Script to apply all GameCanvas modifications atomically
set -e

FILE="frontend/src/engine/GameCanvas.ts"
BACKUP="frontend/src/engine/GameCanvas.ts.backup_final"

cd /mnt/d/Projetos/shipshooter

# Create backup
cp "$FILE" "$BACKUP"

# Use node to make modifications
node -e "
const fs = require('fs');
let content = fs.readFileSync('$FILE', 'utf8');

// 1. Add import
content = content.replace(
  \"import { ParallaxBackground } from './ParallaxBackground';\",
  \"import { ParallaxBackground } from './ParallaxBackground';\\nimport { DebrisSystem } from './DebrisSystem';\"
);

// 2. Add fields
content = content.replace(
  'private backgroundShipsGraphic: Graphics | null = null;',
  \`private backgroundShipsGraphic: Graphics | null = null;
  private debrisSystem: DebrisSystem | null = null;
  private flashGraphic: Graphics | null = null;
  private flashAlpha: number = 0;\`
);

// 3. Add initialization
content = content.replace(
  'this.particleSystem = new ParticleSystem(this.particleContainer);',
  \`this.particleSystem = new ParticleSystem(this.particleContainer);
    this.debrisSystem = new DebrisSystem(this.particleContainer);
    
    this.flashGraphic = new Graphics();
    this.gameContainer.addChild(this.flashGraphic);\`
);

// 4. Add update calls
content = content.replace(
  'this.particleSystem.update(delta);',
  \`this.particleSystem.update(delta);
    }
    
    if (this.debrisSystem) {
      this.debrisSystem.update(delta);
    }
    
    this.updateFlash(delta);\`
);

// 5. Add new methods before setupInput
const newMethods = \`  createFlash(alpha: number = 0.8): void {
    this.flashAlpha = alpha;
  }
  
  createHitParticles(x: number, y: number, color: number = 0xffff00): void {
    if (!this.particleSystem) return;
    this.particleSystem.createHitSpark(x, y, color);
  }
  
  createWreck(x: number, y: number, size: number = 20, color: number = 0x666666): void {
    if (!this.debrisSystem) return;
    this.debrisSystem.createWreck(x, y, size, color);
  }
  
  private updateFlash(delta: number): void {
    if (!this.flashGraphic) return;
    
    if (this.flashAlpha > 0) {
      this.flashGraphic.clear();
      this.flashGraphic.rect(0, 0, 1200, 900);
      this.flashGraphic.fill({ color: 0xffffff, alpha: this.flashAlpha });
      this.flashAlpha = Math.max(0, this.flashAlpha - delta * 4);
    } else {
      this.flashGraphic.clear();
    }
  }
  
  \`;

content = content.replace(
  'private setupInput(): void {',
  newMethods + 'private setupInput(): void {'
);

// 6. Add cleanup before engine = null
content = content.replace(
  'this.parallaxBackground = null;\\n    }\\n    \\n    this.engine = null;',
  \`this.parallaxBackground = null;
    }
    
    if (this.debrisSystem) {
      this.debrisSystem.destroy();
      this.debrisSystem = null;
    }
    
    this.engine = null;\`
);

fs.writeFileSync('$FILE', content);
console.log('File updated successfully');
"

echo "Done. Verify with: npx tsc --noEmit"
