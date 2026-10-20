// Local build-sfx CommonJS generator. Kept inside Assets per project authoring rules.
const fs = require('fs');
const path = require('path');
// Regeneration is optional: committed WAVs are ready for Lens Studio.
// CLAD_SFX_TOOLS must point at the installed CLAD skills/build-sfx/tools directory.
const toolsPath = process.env.CLAD_SFX_TOOLS;
if (!toolsPath || !path.isAbsolute(toolsPath)) {
 console.error('Optional SFX regeneration: set CLAD_SFX_TOOLS to an absolute CLAD skills/build-sfx/tools directory. Included WAVs need no regeneration.');
 process.exit(1);
}
let audio;
try { audio = require(toolsPath); }
catch (error) { console.error('Cannot load CLAD_SFX_TOOLS: '+error.message); process.exit(1); }
const PROJECT_ASSETS_SFX = path.resolve(__dirname, '../GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX,{recursive:true});
const p=audio.sfx_presets;
for (const [name,render] of Object.entries({
 PartTrailRecord:()=>p.uiClick({character:'soft'}),
 PartTrailError:()=>p.uiError({pitch:2}),
 PartTrailReturn:()=>p.uiToggle({on:true}),
 PartTrailComplete:()=>p.uiSuccess(),
})) {
 let result=audio.mix_bus.applyFx(render(),{hpf:100,gain:0.7});
 audio.mix_bus.masterChain(result,{normalize:'peak'});
 if(result.left){audio.fadeOut(result.left,0.008);audio.fadeOut(result.right,0.008);}else audio.fadeOut(result,0.008);
 audio.WavBuilder.write(result,path.join(PROJECT_ASSETS_SFX,name+'.wav'));
 console.log(name+' -> '+path.join(PROJECT_ASSETS_SFX,name+'.wav'));
}
