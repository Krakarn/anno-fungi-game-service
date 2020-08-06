import { stateBasedEffects } from './state-based-effects';
import { getInitialState, IGameState } from './state';

export class GameContainer {
  private states: IGameState[];
  private initialState: IGameState;
  private actions: any[];
  private stateBasedEffects: Function[];

  constructor(initialState: IGameState) {
    this.states = [];
    this.actions = [];
    this.stateBasedEffects = [];
    this.initialState = initialState;
    this.states.push(initialState);
  }

  public getLatestState(): IGameState {
    return this.states.slice(-1).pop() || this.initialState;
  }

  public applyStateBasedEffects(): void {
    this.stateBasedEffects.forEach(effect => this.next(effect));
  }

  public next(reducer: Function): IGameState {
    const newState: IGameState = reducer(this.getLatestState());
    this.states.unshift(newState);
    this.actions.unshift(reducer);

    return newState;
  }
}
