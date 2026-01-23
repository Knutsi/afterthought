export type TaskID = string;

export class TaskModel {
  tasks: Task[] = []
  relations: TaskRelation[] = []
}

// a task the user wants to do or needs to be aware of
export class Task {
  id: TaskID
  name: string
  done: boolean = false;
  description: string | null = null
  deadline: Date | null = null
  archivedAtUtc: Date | null = null

  constructor(name: string) {
    this.id = "TODO: GENERATE"
    this.name = name;
  }
}


export class TaskRelation {
  from: TaskID
  to: TaskID

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
}


