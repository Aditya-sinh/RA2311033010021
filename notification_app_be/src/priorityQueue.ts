import { ScoredNotification } from "./types";

export class TopNotificationsHeap {
  private heap: ScoredNotification[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChildIndex(i: number): number {
    return 2 * i + 1;
  }

  private rightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private bubbleUp(index: number): void {
    while (
      index > 0 &&
      this.heap[this.parentIndex(index)].priorityScore >
        this.heap[index].priorityScore
    ) {
      this.swap(index, this.parentIndex(index));
      index = this.parentIndex(index);
    }
  }

  private bubbleDown(index: number): void {
    let smallest = index;
    const left = this.leftChildIndex(index);
    const right = this.rightChildIndex(index);

    if (left < this.heap.length && this.heap[left].priorityScore < this.heap[smallest].priorityScore) {
      smallest = left;
    }
    if (right < this.heap.length && this.heap[right].priorityScore < this.heap[smallest].priorityScore) {
      smallest = right;
    }
    if (smallest !== index) {
      this.swap(index, smallest);
      this.bubbleDown(smallest);
    }
  }

  insert(notification: ScoredNotification): void {
    if (this.heap.length < this.maxSize) {
      this.heap.push(notification);
      this.bubbleUp(this.heap.length - 1);
    } else if (notification.priorityScore > this.heap[0].priorityScore) {
      this.heap[0] = notification;
      this.bubbleDown(0);
    }
  }

  getTopN(): ScoredNotification[] {
    return [...this.heap].sort((a, b) => b.priorityScore - a.priorityScore);
  }
}