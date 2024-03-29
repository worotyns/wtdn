import { Atom, PropertiesOnly } from "atoms";
import { Task } from "./task.ts";

export class WhatToDoNext extends Atom<WhatToDoNext> {
  static first(tasks: Task[]): Task | undefined {
    return tasks[0];
  }

  static createWithIdentity(identity: string): WhatToDoNext {
    return Object.assign(new WhatToDoNext(), { identity });
  }

  static orderByVotes(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      return b.voters.length - a.voters.length;
    });
  }

  static orderByCompleted(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      if (a.completed && !b.completed) {
        return 1;
      } else if (!a.completed && b.completed) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  static filterUnassigned(tasks: Task[]): Task[] {
    return tasks.filter((task) => task.assigned === null);
  }

  static filterAssigned(tasks: Task[]): Task[] {
    return tasks.filter((task) => task.assigned !== null);
  }

  public tasks: Task[] = [];
  public archive: Task[] = [];

  addTask(task: Task): void {
    this.tasks.push(task);
  }

  archiveTask(task: Task): void {
    this.archive.push(task);
    this.tasks = this.tasks.filter((t) => t.identity !== task.identity);
  }

  assignToFirstWithHighVotesUnassigned(newAssignee: string): void {
    const orderedByVotes = this.tasks.sort((a, b) => {
      return b.voters.length - a.voters.length;
    });

    const firstUnassigned = WhatToDoNext.first(
      WhatToDoNext.orderByVotes(
        WhatToDoNext.filterUnassigned(orderedByVotes),
      ),
    );

    if (!firstUnassigned) {
      throw new Error("No unassigned tasks");
    }

    firstUnassigned.assign(newAssignee);
  }

  getTasks(): Task[] {
    return WhatToDoNext.orderByCompleted(
      WhatToDoNext.orderByVotes(this.tasks),
    );
  }

  getTask(identity: string): Task {
    const task = this.tasks.find((task) => task.identity === identity);

    if (!task) {
      throw new Error(`Task with identity ${identity} not found`);
    }

    return task;
  }

  getAssignedTasks(): Task[] {
    return WhatToDoNext.filterAssigned(WhatToDoNext.orderByVotes(this.tasks));
  }

  static deserialize(rawValue: PropertiesOnly<WhatToDoNext>) {
    return Object.assign(
      new WhatToDoNext(),
      rawValue,
      {
        tasks: rawValue.tasks.map((task: PropertiesOnly<Task>) =>
          Task.deserialize(task)
        ),
        archive: rawValue.archive.map((task: PropertiesOnly<Task>) =>
          Task.deserialize(task)
        ),
      },
    );
  }
}
