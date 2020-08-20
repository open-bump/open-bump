import fetch from "node-fetch";
import uuid from "uuid";
import BaseError from "./errors/BaseError";
import Application from "./models/Application";
import ApplicationService from "./models/ApplicationService";
import SBLP from "./SBLP";

export interface ITask {
  id: string;
  application: Application;
  body: object;
  subtasks: Array<ISubTask>;
  createdAt: Date;
}

export interface ISubTask {
  task: ITask;
  service: ApplicationService;
  target: Application;
  errored: boolean;
  res: object | null;
}

export default class TaskManager {
  constructor(private instance: SBLP) {}

  private tasks: { [id: string]: ITask } = {};

  public async start(applicationId: string, body: object) {
    const application = await Application.scope("full").findOne({
      where: { id: applicationId }
    });

    if (!application) throw new BaseError("Invalid Error");

    const task: ITask = {
      id: uuid.v4(),
      application,
      subtasks: [],
      body,
      createdAt: new Date()
    };

    for (const service of application.services) {
      const { target } = service;
      const subtask: ISubTask = {
        task,
        service,
        target: target,
        errored: false,
        res: null
      };
      task.subtasks.push(subtask);

      this.startSubtask(subtask);
    }

    this.tasks[task.id] = task;

    setTimeout(() => {
      delete this.tasks[task.id];
    }, 1000 * 60);

    return {
      id: task.id
    };
  }

  public check(applicationId: string, taskId: string) {
    const task = this.tasks[taskId];
    if (task && task.application.id === applicationId)
      return task.subtasks.map((subtask) => {
        const { target } = subtask;
        const { bot } = target;
        if (subtask.errored)
          return {
            bot: bot,
            data: {
              type: "ERROR",
              code: "OTHER",
              message: "HTTP Error",
              service: "SBLP Centralized"
            }
          };
        else if (subtask.res)
          return {
            bot: bot,
            data: subtask.res
          };
        else
          return {
            bot: bot,
            data: {
              type: "START",
              service: "SBLP Centralized"
            }
          };
      });
    else
      return {
        type: "ERROR",
        code: "OTHER",
        message: "Timeout",
        service: "SBLP Centralized"
      };
  }

  private async startSubtask(subtask: ISubTask) {
    const { task, target } = subtask;
    const { application } = task;

    console.log(
      `Starting subtask of task ${task.id} by app ${application.name} (${application.id})`
    );

    const url = `${target.getBase()}sblp/request`;
    console.log(`[DEBUG] URL: ${url}`);

    try {
      const res: object = await fetch("https://proxy.discord.one/", {
        method: "POST",
        headers: {
          "x-target": url,
          authorization: subtask.service.authorization,
          "content-type": "application/json"
        },
        body: JSON.stringify(task.body)
      }).then((res) => res.json());
      subtask.res = res;
      console.log(
        `Successfully received response from target ${target.name} (${target.id}) for task ${task.id}`
      );
    } catch (error) {
      subtask.errored = true;
      console.error(
        `Error during receiving of response from target ${target.name} (${target.id}) for task ${task.id}`,
        error
      );
    }
  }
}
