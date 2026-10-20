import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import {PartTrailLeafRecordScenario} from "./PartTrailLeafRecordScenario";
import {PartTrailLeafCueScenario} from "./PartTrailLeafCueScenario";
import {PartTrailLeafGuardScenario} from "./PartTrailLeafGuardScenario";
import {PartTrailLeafPauseUndoScenario} from "./PartTrailLeafPauseUndoScenario";
import {PartTrailLeafCompleteScenario} from "./PartTrailLeafCompleteScenario";
import {PartTrailLeafIKScenario} from "./PartTrailLeafIKScenario";
import {PartTrailLeafDemoScenario} from "./PartTrailLeafDemoScenario";
import {PartCueLeafStaleSelectionScenario} from "./PartCueLeafStaleSelectionScenario";
@component
export class PartTrailLeafIndex extends BaseScriptComponent {
  @scenariosIndex static scenariosIndex:ScenarioMetadata[]=[
    {id:"parttrail-01-record-four",typename:PartTrailLeafRecordScenario.getTypeName()},
    {id:"parttrail-02-active-pair-animation",typename:PartTrailLeafCueScenario.getTypeName()},
    {id:"parttrail-03-wrong-part-count-confirm",typename:PartTrailLeafGuardScenario.getTypeName()},
    {id:"parttrail-04-pause-resume-undo",typename:PartTrailLeafPauseUndoScenario.getTypeName()},
    {id:"parttrail-05-complete-confirm-restart",typename:PartTrailLeafCompleteScenario.getTypeName()},
    {id:"parttrail-06-ik-toolbar-selection",typename:PartTrailLeafIKScenario.getTypeName()},
    {id:"partcue-07-demo",typename:PartTrailLeafDemoScenario.getTypeName()},
    {id:"partcue-08-stale-selection-guard",typename:PartCueLeafStaleSelectionScenario.getTypeName()}
  ];
}
