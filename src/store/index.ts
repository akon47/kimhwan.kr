import { createStore } from 'vuex';
import { CommonState, commonStore } from '@/store/modules/common.store';

export interface RootState {
  commonStore: CommonState;
}

export default createStore({
  modules: { commonStore },
});
