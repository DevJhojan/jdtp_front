import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Budget_Key {
  id: UUIDString;
  __typename?: 'Budget_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateNewTransactionData {
  transaction_insert: Transaction_Key;
}

export interface CreateNewTransactionVariables {
  userId: UUIDString;
  categoryId: UUIDString;
  amount: number;
  type: string;
  date: DateString;
  description: string;
  notes?: string | null;
}

export interface GetUserBudgetsData {
  budgets: ({
    id: UUIDString;
    amount: number;
    period: string;
    startDate: DateString;
    category: {
      name: string;
      type: string;
    };
  } & Budget_Key)[];
}

export interface ListUserCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    type: string;
    description?: string | null;
    createdAt: TimestampString;
  } & Category_Key)[];
}

export interface ListUserCategoriesVariables {
  userId: UUIDString;
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UpdateCategoryDescriptionData {
  category_update?: Category_Key | null;
}

export interface UpdateCategoryDescriptionVariables {
  categoryId: UUIDString;
  newDescription: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListUserCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUserCategoriesVariables): QueryRef<ListUserCategoriesData, ListUserCategoriesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListUserCategoriesVariables): QueryRef<ListUserCategoriesData, ListUserCategoriesVariables>;
  operationName: string;
}
export const listUserCategoriesRef: ListUserCategoriesRef;

export function listUserCategories(vars: ListUserCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserCategoriesData, ListUserCategoriesVariables>;
export function listUserCategories(dc: DataConnect, vars: ListUserCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserCategoriesData, ListUserCategoriesVariables>;

interface CreateNewTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewTransactionVariables): MutationRef<CreateNewTransactionData, CreateNewTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewTransactionVariables): MutationRef<CreateNewTransactionData, CreateNewTransactionVariables>;
  operationName: string;
}
export const createNewTransactionRef: CreateNewTransactionRef;

export function createNewTransaction(vars: CreateNewTransactionVariables): MutationPromise<CreateNewTransactionData, CreateNewTransactionVariables>;
export function createNewTransaction(dc: DataConnect, vars: CreateNewTransactionVariables): MutationPromise<CreateNewTransactionData, CreateNewTransactionVariables>;

interface GetUserBudgetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserBudgetsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserBudgetsData, undefined>;
  operationName: string;
}
export const getUserBudgetsRef: GetUserBudgetsRef;

export function getUserBudgets(options?: ExecuteQueryOptions): QueryPromise<GetUserBudgetsData, undefined>;
export function getUserBudgets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserBudgetsData, undefined>;

interface UpdateCategoryDescriptionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryDescriptionVariables): MutationRef<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCategoryDescriptionVariables): MutationRef<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
  operationName: string;
}
export const updateCategoryDescriptionRef: UpdateCategoryDescriptionRef;

export function updateCategoryDescription(vars: UpdateCategoryDescriptionVariables): MutationPromise<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
export function updateCategoryDescription(dc: DataConnect, vars: UpdateCategoryDescriptionVariables): MutationPromise<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;

