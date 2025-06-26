import {Stage} from "src/Common/Infrastructure/DB/schemas/stage.schema";
import {Step} from "src/Common/Infrastructure/DB/schemas/step.schema";
import {Project} from "src/Common/Infrastructure/DB/schemas/project.schema";

export class ProjectsModel {
    projects: Project[];
    stages: Stage[];
    steps: Step[];
}
