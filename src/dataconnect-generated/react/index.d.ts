import { ListUserCategoriesData, ListUserCategoriesVariables, CreateNewTransactionData, CreateNewTransactionVariables, GetUserBudgetsData, UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListUserCategories(vars: ListUserCategoriesVariables, options?: useDataConnectQueryOptions<ListUserCategoriesData>): UseDataConnectQueryResult<ListUserCategoriesData, ListUserCategoriesVariables>;
export function useListUserCategories(dc: DataConnect, vars: ListUserCategoriesVariables, options?: useDataConnectQueryOptions<ListUserCategoriesData>): UseDataConnectQueryResult<ListUserCategoriesData, ListUserCategoriesVariables>;

export function useCreateNewTransaction(options?: useDataConnectMutationOptions<CreateNewTransactionData, FirebaseError, CreateNewTransactionVariables>): UseDataConnectMutationResult<CreateNewTransactionData, CreateNewTransactionVariables>;
export function useCreateNewTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewTransactionData, FirebaseError, CreateNewTransactionVariables>): UseDataConnectMutationResult<CreateNewTransactionData, CreateNewTransactionVariables>;

export function useGetUserBudgets(options?: useDataConnectQueryOptions<GetUserBudgetsData>): UseDataConnectQueryResult<GetUserBudgetsData, undefined>;
export function useGetUserBudgets(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserBudgetsData>): UseDataConnectQueryResult<GetUserBudgetsData, undefined>;

export function useUpdateCategoryDescription(options?: useDataConnectMutationOptions<UpdateCategoryDescriptionData, FirebaseError, UpdateCategoryDescriptionVariables>): UseDataConnectMutationResult<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
export function useUpdateCategoryDescription(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCategoryDescriptionData, FirebaseError, UpdateCategoryDescriptionVariables>): UseDataConnectMutationResult<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
