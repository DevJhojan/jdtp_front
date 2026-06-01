# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListUserCategories*](#listusercategories)
  - [*GetUserBudgets*](#getuserbudgets)
- [**Mutations**](#mutations)
  - [*CreateNewTransaction*](#createnewtransaction)
  - [*UpdateCategoryDescription*](#updatecategorydescription)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListUserCategories
You can execute the `ListUserCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUserCategories(vars: ListUserCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserCategoriesData, ListUserCategoriesVariables>;

interface ListUserCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUserCategoriesVariables): QueryRef<ListUserCategoriesData, ListUserCategoriesVariables>;
}
export const listUserCategoriesRef: ListUserCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUserCategories(dc: DataConnect, vars: ListUserCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserCategoriesData, ListUserCategoriesVariables>;

interface ListUserCategoriesRef {
  ...
  (dc: DataConnect, vars: ListUserCategoriesVariables): QueryRef<ListUserCategoriesData, ListUserCategoriesVariables>;
}
export const listUserCategoriesRef: ListUserCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUserCategoriesRef:
```typescript
const name = listUserCategoriesRef.operationName;
console.log(name);
```

### Variables
The `ListUserCategories` query requires an argument of type `ListUserCategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListUserCategoriesVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `ListUserCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUserCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUserCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    type: string;
    description?: string | null;
    createdAt: TimestampString;
  } & Category_Key)[];
}
```
### Using `ListUserCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUserCategories, ListUserCategoriesVariables } from '@dataconnect/generated';

// The `ListUserCategories` query requires an argument of type `ListUserCategoriesVariables`:
const listUserCategoriesVars: ListUserCategoriesVariables = {
  userId: ..., 
};

// Call the `listUserCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUserCategories(listUserCategoriesVars);
// Variables can be defined inline as well.
const { data } = await listUserCategories({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUserCategories(dataConnect, listUserCategoriesVars);

console.log(data.categories);

// Or, you can use the `Promise` API.
listUserCategories(listUserCategoriesVars).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `ListUserCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUserCategoriesRef, ListUserCategoriesVariables } from '@dataconnect/generated';

// The `ListUserCategories` query requires an argument of type `ListUserCategoriesVariables`:
const listUserCategoriesVars: ListUserCategoriesVariables = {
  userId: ..., 
};

// Call the `listUserCategoriesRef()` function to get a reference to the query.
const ref = listUserCategoriesRef(listUserCategoriesVars);
// Variables can be defined inline as well.
const ref = listUserCategoriesRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUserCategoriesRef(dataConnect, listUserCategoriesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## GetUserBudgets
You can execute the `GetUserBudgets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserBudgets(options?: ExecuteQueryOptions): QueryPromise<GetUserBudgetsData, undefined>;

interface GetUserBudgetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserBudgetsData, undefined>;
}
export const getUserBudgetsRef: GetUserBudgetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserBudgets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserBudgetsData, undefined>;

interface GetUserBudgetsRef {
  ...
  (dc: DataConnect): QueryRef<GetUserBudgetsData, undefined>;
}
export const getUserBudgetsRef: GetUserBudgetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserBudgetsRef:
```typescript
const name = getUserBudgetsRef.operationName;
console.log(name);
```

### Variables
The `GetUserBudgets` query has no variables.
### Return Type
Recall that executing the `GetUserBudgets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserBudgetsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserBudgets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserBudgets } from '@dataconnect/generated';


// Call the `getUserBudgets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserBudgets();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserBudgets(dataConnect);

console.log(data.budgets);

// Or, you can use the `Promise` API.
getUserBudgets().then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

### Using `GetUserBudgets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserBudgetsRef } from '@dataconnect/generated';


// Call the `getUserBudgetsRef()` function to get a reference to the query.
const ref = getUserBudgetsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserBudgetsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.budgets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewTransaction
You can execute the `CreateNewTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewTransaction(vars: CreateNewTransactionVariables): MutationPromise<CreateNewTransactionData, CreateNewTransactionVariables>;

interface CreateNewTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewTransactionVariables): MutationRef<CreateNewTransactionData, CreateNewTransactionVariables>;
}
export const createNewTransactionRef: CreateNewTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewTransaction(dc: DataConnect, vars: CreateNewTransactionVariables): MutationPromise<CreateNewTransactionData, CreateNewTransactionVariables>;

interface CreateNewTransactionRef {
  ...
  (dc: DataConnect, vars: CreateNewTransactionVariables): MutationRef<CreateNewTransactionData, CreateNewTransactionVariables>;
}
export const createNewTransactionRef: CreateNewTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewTransactionRef:
```typescript
const name = createNewTransactionRef.operationName;
console.log(name);
```

### Variables
The `CreateNewTransaction` mutation requires an argument of type `CreateNewTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewTransactionVariables {
  userId: UUIDString;
  categoryId: UUIDString;
  amount: number;
  type: string;
  date: DateString;
  description: string;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `CreateNewTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewTransactionData {
  transaction_insert: Transaction_Key;
}
```
### Using `CreateNewTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewTransaction, CreateNewTransactionVariables } from '@dataconnect/generated';

// The `CreateNewTransaction` mutation requires an argument of type `CreateNewTransactionVariables`:
const createNewTransactionVars: CreateNewTransactionVariables = {
  userId: ..., 
  categoryId: ..., 
  amount: ..., 
  type: ..., 
  date: ..., 
  description: ..., 
  notes: ..., // optional
};

// Call the `createNewTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewTransaction(createNewTransactionVars);
// Variables can be defined inline as well.
const { data } = await createNewTransaction({ userId: ..., categoryId: ..., amount: ..., type: ..., date: ..., description: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewTransaction(dataConnect, createNewTransactionVars);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
createNewTransaction(createNewTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

### Using `CreateNewTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewTransactionRef, CreateNewTransactionVariables } from '@dataconnect/generated';

// The `CreateNewTransaction` mutation requires an argument of type `CreateNewTransactionVariables`:
const createNewTransactionVars: CreateNewTransactionVariables = {
  userId: ..., 
  categoryId: ..., 
  amount: ..., 
  type: ..., 
  date: ..., 
  description: ..., 
  notes: ..., // optional
};

// Call the `createNewTransactionRef()` function to get a reference to the mutation.
const ref = createNewTransactionRef(createNewTransactionVars);
// Variables can be defined inline as well.
const ref = createNewTransactionRef({ userId: ..., categoryId: ..., amount: ..., type: ..., date: ..., description: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewTransactionRef(dataConnect, createNewTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

## UpdateCategoryDescription
You can execute the `UpdateCategoryDescription` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCategoryDescription(vars: UpdateCategoryDescriptionVariables): MutationPromise<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;

interface UpdateCategoryDescriptionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryDescriptionVariables): MutationRef<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
}
export const updateCategoryDescriptionRef: UpdateCategoryDescriptionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCategoryDescription(dc: DataConnect, vars: UpdateCategoryDescriptionVariables): MutationPromise<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;

interface UpdateCategoryDescriptionRef {
  ...
  (dc: DataConnect, vars: UpdateCategoryDescriptionVariables): MutationRef<UpdateCategoryDescriptionData, UpdateCategoryDescriptionVariables>;
}
export const updateCategoryDescriptionRef: UpdateCategoryDescriptionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCategoryDescriptionRef:
```typescript
const name = updateCategoryDescriptionRef.operationName;
console.log(name);
```

### Variables
The `UpdateCategoryDescription` mutation requires an argument of type `UpdateCategoryDescriptionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCategoryDescriptionVariables {
  categoryId: UUIDString;
  newDescription: string;
}
```
### Return Type
Recall that executing the `UpdateCategoryDescription` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCategoryDescriptionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCategoryDescriptionData {
  category_update?: Category_Key | null;
}
```
### Using `UpdateCategoryDescription`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCategoryDescription, UpdateCategoryDescriptionVariables } from '@dataconnect/generated';

// The `UpdateCategoryDescription` mutation requires an argument of type `UpdateCategoryDescriptionVariables`:
const updateCategoryDescriptionVars: UpdateCategoryDescriptionVariables = {
  categoryId: ..., 
  newDescription: ..., 
};

// Call the `updateCategoryDescription()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCategoryDescription(updateCategoryDescriptionVars);
// Variables can be defined inline as well.
const { data } = await updateCategoryDescription({ categoryId: ..., newDescription: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCategoryDescription(dataConnect, updateCategoryDescriptionVars);

console.log(data.category_update);

// Or, you can use the `Promise` API.
updateCategoryDescription(updateCategoryDescriptionVars).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

### Using `UpdateCategoryDescription`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCategoryDescriptionRef, UpdateCategoryDescriptionVariables } from '@dataconnect/generated';

// The `UpdateCategoryDescription` mutation requires an argument of type `UpdateCategoryDescriptionVariables`:
const updateCategoryDescriptionVars: UpdateCategoryDescriptionVariables = {
  categoryId: ..., 
  newDescription: ..., 
};

// Call the `updateCategoryDescriptionRef()` function to get a reference to the mutation.
const ref = updateCategoryDescriptionRef(updateCategoryDescriptionVars);
// Variables can be defined inline as well.
const ref = updateCategoryDescriptionRef({ categoryId: ..., newDescription: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCategoryDescriptionRef(dataConnect, updateCategoryDescriptionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

