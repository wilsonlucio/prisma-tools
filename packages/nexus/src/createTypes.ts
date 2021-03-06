import { Options } from "./types";
import { writeFile, mkdir } from "fs";
import { schema } from "./schema";
import { format } from "prettier";
import { createQueriesAndMutations } from "./CreateQueriesAndMutations";
import { createInput } from "./InputTypes";
import { DMMF } from "@prisma/client/runtime";

const defaultOptions: Options = {
  inputTypesOutput: "src/graphql",
  modelsOutput: "src/graphql/models",
  fieldsExclude: [],
  modelsExclude: [],
  excludeFieldsByModel: {},
  excludeQueriesAndMutations: [],
  excludeQueriesAndMutationsByModel: {},
};

export function createTypes(customOptions: Partial<Options>) {
  const options: Options = { ...defaultOptions, ...customOptions };
  let index = "";
  writeFile(
    `${options.inputTypesOutput}/inputTypes.ts`,
    formation(createInput(options.nexusSchema)),
    () => {}
  );
  if (options.onlyInputType) {
    return;
  }
  schema.outputTypes.forEach((model) => {
    if (
      !["Query", "Mutation"].includes(model.name) &&
      !model.name.startsWith("Aggregate") &&
      model.name !== "BatchPayload"
    ) {
      index += `export * from './${model.name}';
`;
      let fileContent = `${
        options.nexusSchema
          ? `import { objectType } from '@nexus/schema'`
          : `import { schema } from 'nexus'`
      }
  
`;
      fileContent += `${
        options.nexusSchema ? `export const ${model.name} = ` : "schema."
      }objectType({
  name: '${model.name}',
  definition(t) {
    `;
      const fieldsExclude = options.fieldsExclude.concat(
        options.excludeFieldsByModel[model.name]
      );
      model.fields.forEach((field) => {
        if (!fieldsExclude.includes(field.name)) {
          const options = getOptions(field);
          if (
            field.outputType.kind === "scalar" &&
            field.outputType.type !== "DateTime"
          ) {
            fileContent += `t.${(field.outputType
              .type as String).toLowerCase()}('${field.name}'${options})
    `;
          } else {
            fileContent += `t.field('${field.name}'${options})
    `;
          }
        }
      });
      fileContent += `},
})
  
`;
      const operations = createQueriesAndMutations(model.name, options);
      let modelIndex = `export * from './type'
      `;
      mkdir(`${options.modelsOutput}/${model.name}`, () => {});
      if (
        !options.disableQueries &&
        !options.modelsExclude.find(
          (item) => item.name === model.name && item.queries
        )
      ) {
        writeFile(
          `${options.modelsOutput}/${model.name}/queries.ts`,
          formation(operations.queries),
          () => {}
        );
        modelIndex += `export * from './queries'
        `;
      }
      if (
        !options.disableMutations &&
        !options.modelsExclude.find(
          (item) => item.name === model.name && item.mutations
        )
      ) {
        writeFile(
          `${options.modelsOutput}/${model.name}/mutations.ts`,
          formation(operations.mutations),
          () => {}
        );
        modelIndex += `export * from './mutations'`;
      }
      if (options.nexusSchema) {
        writeFile(
          `${options.modelsOutput}/${model.name}/index.ts`,
          formation(modelIndex),
          () => {}
        );
      }
      writeFile(
        `${options.modelsOutput}/${model.name}/type.ts`,
        formation(fileContent),
        () => {}
      );
    }
  });
  if (options.nexusSchema) {
    writeFile(`${options.modelsOutput}/index.ts`, formation(index), () => {});
  }
}

function getOptions(field: DMMF.SchemaField) {
  const options: any = field.outputType.isList
    ? { nullable: false, list: [true] }
    : { nullable: !field.outputType.isRequired };
  if (
    field.outputType.kind !== "scalar" ||
    field.outputType.type === "DateTime"
  )
    options["type"] = field.outputType.type;
  if (field.args.length > 0) {
    field.args.forEach((arg) => {
      if (!options["args"]) options["args"] = {};
      options["args"][arg.name] = arg.inputType[0].type;
    });
  }
  let toString = JSON.stringify(options);
  if (field.outputType.kind === "object") {
    toString = toString.slice(0, -1);
    toString += `, resolve(parent) {
      return parent['${field.name}']
    },
    }`;
  }
  return ", " + toString;
}

export function formation(text: string) {
  return format(text, {
    singleQuote: true,
    semi: false,
    trailingComma: "all",
    parser: "babel",
  });
}
