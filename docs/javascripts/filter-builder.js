(() => {
  const METADATA_OPERATORS = [
    { value: "$eq", label: "$eq" },
    { value: "$ne", label: "$ne" },
    { value: "$gt", label: "$gt" },
    { value: "$gte", label: "$gte" },
    { value: "$lt", label: "$lt" },
    { value: "$lte", label: "$lte" },
    { value: "$in", label: "$in" },
    { value: "$nin", label: "$nin" },
    { value: "$contains", label: "$contains" },
    { value: "$not_contains", label: "$not_contains" },
  ];

  const DOCUMENT_OPERATORS = [
    { value: "$contains", label: "$contains" },
    { value: "$not_contains", label: "$not_contains" },
    { value: "$regex", label: "$regex" },
    { value: "$not_regex", label: "$not_regex" },
  ];

  const VALUE_TYPES = [
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
    { value: "string_array", label: "String[]" },
    { value: "number_array", label: "Number[]" },
    { value: "boolean_array", label: "Boolean[]" },
  ];

  const OUTPUT_TABS = ["json", "python", "typescript"];
  const CLOUD_RANK_MODES = ["knn", "hybrid_rrf", "none"];
  const LOCAL_CALL_MODES = ["query", "get"];

  const isArrayOperator = (operator) => operator === "$in" || operator === "$nin";

  const parseBoolean = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  };

  const parseTypedValue = (value, type) => {
    const raw = String(value || "").trim();

    if (type === "number") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : raw;
    }

    if (type === "boolean") {
      return parseBoolean(raw);
    }

    if (type === "string_array") {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    if (type === "number_array") {
      return raw
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
    }

    if (type === "boolean_array") {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => parseBoolean(item));
    }

    return raw;
  };

  const parseInteger = (value, fallback, min = 0) => {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    if (Number.isNaN(parsed)) {
      return fallback;
    }
    return Math.max(min, parsed);
  };

  const parseCsvList = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const parseRawFilterObject = (text) => {
    const source = String(text ?? "").trim();
    if (!source.length) {
      return { value: null, error: "" };
    }

    try {
      const parsed = JSON.parse(source);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        return {
          value: null,
          error: "Use a JSON object (for example, {\"$and\": [...]}).",
        };
      }
      return { value: parsed, error: "" };
    } catch (_error) {
      return {
        value: null,
        error: "Invalid JSON. Fix syntax to apply this filter.",
      };
    }
  };

  const cloneJson = (value) => JSON.parse(JSON.stringify(value));

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const indentBlock = (text, spaces) => {
    const prefix = " ".repeat(spaces);
    return String(text)
      .split("\n")
      .map((line, index) => (index === 0 ? line : `${prefix}${line}`))
      .join("\n");
  };

  const highlightCode = (source, lang) => {
    const tokens = [];
    const markerFor = (index) => {
      let n = index;
      let alpha = "";
      do {
        alpha = String.fromCharCode(65 + (n % 26)) + alpha;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return `@@FBTOK_${alpha}@@`;
    };
    const tokenized = (input, pattern, className) =>
      input.replace(pattern, (match) => {
        const marker = markerFor(tokens.length);
        tokens.push({
          marker,
          html: `<span class="fb-token ${className}">${match}</span>`,
        });
        return marker;
      });

    const restoreTokens = (input) =>
      tokens.reduce(
        (acc, token) => acc.split(token.marker).join(token.html),
        input
      );

    let code = escapeHtml(source);

    if (lang === "json") {
      code = tokenized(code, /"(?:\\.|[^"\\])*"/g, "fb-token-string");
      code = code.replace(
        /\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+\-]?\d+)?\b/g,
        '<span class="fb-token fb-token-number">$&</span>'
      );
      code = code.replace(
        /\btrue\b|\bfalse\b|\bnull\b/g,
        '<span class="fb-token fb-token-boolean">$&</span>'
      );
      code = code.replace(
        /[{}[\](),:]/g,
        '<span class="fb-token fb-token-punctuation">$&</span>'
      );
      return restoreTokens(code);
    }

    if (lang === "python") {
      code = tokenized(
        code,
        /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g,
        "fb-token-string"
      );
      code = tokenized(code, /#.*$/gm, "fb-token-comment");
      code = code.replace(
        /\b(import|from|as|def|class|return|if|elif|else|for|while|in|try|except|with|lambda|and|or|not|None|True|False)\b/g,
        '<span class="fb-token fb-token-keyword">$&</span>'
      );
      code = code.replace(
        /\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/g,
        '<span class="fb-token fb-token-number">$&</span>'
      );
      return restoreTokens(code);
    }

    if (lang === "typescript") {
      code = tokenized(
        code,
        /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,
        "fb-token-string"
      );
      code = tokenized(code, /\/\*[\s\S]*?\*\//g, "fb-token-comment");
      code = tokenized(code, /\/\/.*$/gm, "fb-token-comment");
      code = code.replace(
        /\b(import|from|export|const|let|var|new|class|return|await|async|if|else|for|while|switch|case|break|continue|function|interface|type|extends|implements|null|undefined|true|false)\b/g,
        '<span class="fb-token fb-token-keyword">$&</span>'
      );
      code = code.replace(
        /\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/g,
        '<span class="fb-token fb-token-number">$&</span>'
      );
      return restoreTokens(code);
    }

    return code;
  };

  const jsonString = (value) => JSON.stringify(value);

  const toPythonLiteral = (value, level = 0) => {
    const indent = " ".repeat(level * 4);
    const nextIndent = " ".repeat((level + 1) * 4);

    if (value === null || value === undefined) {
      return "None";
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return "[]";
      }
      const items = value
        .map((item) => `${nextIndent}${toPythonLiteral(item, level + 1)}`)
        .join(",\n");
      return `[\n${items}\n${indent}]`;
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (!entries.length) {
        return "{}";
      }
      const lines = entries
        .map(
          ([key, entryValue]) =>
            `${nextIndent}${jsonString(key)}: ${toPythonLiteral(entryValue, level + 1)}`
        )
        .join(",\n");
      return `{\n${lines}\n${indent}}`;
    }

    if (typeof value === "string") {
      return jsonString(value);
    }

    if (typeof value === "boolean") {
      return value ? "True" : "False";
    }

    return String(value);
  };

  const createDefaultMetadataRule = () => ({
    field: "category",
    operator: "$eq",
    valueType: "string",
    value: "ml",
  });

  const createDefaultDocumentRule = () => ({
    operator: "$contains",
    value: "chroma",
  });

  const createDefaultCloudOptions = () => ({
    expanded: false,
    rankMode: "none",
    denseQuery: "example query",
    denseLimit: 5,
    sparseQuery: "example query",
    sparseKey: "sparse_embedding",
    rrfK: 60,
    rrfWeights: "0.7,0.3",
    paginationEnabled: false,
    pageLimit: 20,
    pageOffset: 0,
    selectionEnabled: false,
    selectDocument: true,
    selectScore: true,
    selectMetadata: false,
    selectEmbedding: false,
    selectFields: "title,author",
    groupEnabled: false,
    groupKeys: "category",
    groupMinK: 1,
    groupMaxK: 3,
    batchEnabled: false,
    batchCount: 3,
  });

  const createDefaultLocalOptions = () => ({
    expanded: false,
    callMode: "query",
    limit: 5,
    offset: 0,
    includeEnabled: false,
    includeDocuments: true,
    includeMetadatas: true,
    includeDistances: true,
    includeEmbeddings: false,
  });

  const createSelect = (options, selectedValue) => {
    const select = document.createElement("select");
    options.forEach((option) => {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      node.selected = option.value === selectedValue;
      select.appendChild(node);
    });
    return select;
  };

  const combineClauses = (clauses, logic) => {
    if (!clauses.length) {
      return null;
    }
    if (clauses.length === 1) {
      return clauses[0];
    }
    return { [logic]: clauses };
  };

  const buildMetadataClause = (rule) => {
    const field = (rule.field || "").trim() || "metadata_field";
    const operator = rule.operator || "$eq";
    const typedValue = parseTypedValue(rule.value || "", rule.valueType || "string");

    if (operator === "$eq") {
      return { [field]: typedValue };
    }

    return {
      [field]: {
        [operator]: typedValue,
      },
    };
  };

  const buildDocumentClause = (rule) => {
    const operator = rule.operator || "$contains";
    const value = String(rule.value || "").trim() || "example";
    return { [operator]: value };
  };

  const mapDocumentFilterToCloudWhere = (filter) => {
    if (!filter || typeof filter !== "object") {
      return null;
    }

    if (
      "#document" in filter &&
      filter["#document"] &&
      typeof filter["#document"] === "object" &&
      !Array.isArray(filter["#document"])
    ) {
      return { "#document": filter["#document"] };
    }

    if ("$and" in filter && Array.isArray(filter.$and)) {
      const mapped = filter.$and
        .map((item) => mapDocumentFilterToCloudWhere(item))
        .filter(Boolean);
      return combineClauses(mapped, "$and");
    }

    if ("$or" in filter && Array.isArray(filter.$or)) {
      const mapped = filter.$or
        .map((item) => mapDocumentFilterToCloudWhere(item))
        .filter(Boolean);
      return combineClauses(mapped, "$or");
    }

    const entries = Object.entries(filter);
    if (entries.length !== 1) {
      return null;
    }

    const [operator, value] = entries[0];
    return {
      "#document": {
        [operator]: value,
      },
    };
  };

  const normalizeCloudOptions = (cloudState) => {
    const rankMode = CLOUD_RANK_MODES.includes(cloudState.rankMode)
      ? cloudState.rankMode
      : "knn";
    const denseQuery = String(cloudState.denseQuery || "").trim() || "example query";
    const denseLimit = parseInteger(cloudState.denseLimit, 5, 1);
    const sparseQuery = String(cloudState.sparseQuery || "").trim() || "example query";
    const sparseKey = String(cloudState.sparseKey || "").trim() || "sparse_embedding";
    const rrfK = parseInteger(cloudState.rrfK, 60, 1);
    const rrfWeightsParsed = parseCsvList(cloudState.rrfWeights)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const rrfWeights =
      rrfWeightsParsed.length >= 2 ? rrfWeightsParsed.slice(0, 4) : [0.7, 0.3];

    const paginationEnabled = Boolean(cloudState.paginationEnabled);
    const pageLimit = parseInteger(cloudState.pageLimit, 20, 1);
    const pageOffset = parseInteger(cloudState.pageOffset, 0, 0);

    const selectionEnabled = Boolean(cloudState.selectionEnabled);
    const selectedFields = [];
    if (cloudState.selectDocument) selectedFields.push("#document");
    if (cloudState.selectScore) selectedFields.push("#score");
    if (cloudState.selectMetadata) selectedFields.push("#metadata");
    if (cloudState.selectEmbedding) selectedFields.push("#embedding");
    selectedFields.push(...parseCsvList(cloudState.selectFields));

    const groupEnabled = Boolean(cloudState.groupEnabled);
    const groupKeys = parseCsvList(cloudState.groupKeys);
    const resolvedGroupKeys = groupKeys.length ? groupKeys : ["category"];
    const groupMinK = parseInteger(cloudState.groupMinK, 1, 1);
    const groupMaxK = Math.max(parseInteger(cloudState.groupMaxK, 3, 1), groupMinK);

    const batchEnabled = Boolean(cloudState.batchEnabled);
    const batchCount = parseInteger(cloudState.batchCount, 3, 2);

    return {
      rankMode,
      denseQuery,
      denseLimit,
      sparseQuery,
      sparseKey,
      rrfK,
      rrfWeights,
      paginationEnabled,
      pageLimit,
      pageOffset,
      selectionEnabled,
      selectedFields,
      groupEnabled,
      groupKeys: resolvedGroupKeys,
      groupMinK,
      groupMaxK,
      batchEnabled,
      batchCount,
    };
  };

  const buildCloudSearchPayload = (cloud, cloudWhere) => {
    const payload = {};

    if (cloudWhere) {
      payload.where = cloudWhere;
    }

    if (cloud.rankMode === "knn") {
      payload.rank = {
        $knn: {
          query: cloud.denseQuery,
          limit: cloud.denseLimit,
        },
      };
    } else if (cloud.rankMode === "hybrid_rrf") {
      payload.rank = {
        $rrf: {
          ranks: [
            {
              $knn: {
                query: cloud.denseQuery,
                limit: cloud.denseLimit,
                return_rank: true,
              },
            },
            {
              $knn: {
                query: cloud.sparseQuery,
                key: cloud.sparseKey,
                limit: cloud.denseLimit,
                return_rank: true,
              },
            },
          ],
          weights: cloud.rrfWeights,
          k: cloud.rrfK,
        },
      };
    }

    if (cloud.paginationEnabled) {
      payload.limit = {
        limit: cloud.pageLimit,
        offset: cloud.pageOffset,
      };
    }

    if (cloud.selectionEnabled && cloud.selectedFields.length) {
      payload.select = cloud.selectedFields;
    }

    if (cloud.groupEnabled) {
      payload.group_by = {
        keys: cloud.groupKeys,
        min_k: cloud.groupMinK,
        max_k: cloud.groupMaxK,
      };
    }

    return payload;
  };

  const normalizeLocalOptions = (localState) => {
    const callMode = LOCAL_CALL_MODES.includes(localState.callMode)
      ? localState.callMode
      : "query";
    const limit = parseInteger(localState.limit, 5, 1);
    const offset = parseInteger(localState.offset, 0, 0);
    const includeEnabled = Boolean(localState.includeEnabled);
    const include = [];
    if (localState.includeDocuments) include.push("documents");
    if (localState.includeMetadatas) include.push("metadatas");
    if (localState.includeDistances) include.push("distances");
    if (localState.includeEmbeddings) include.push("embeddings");

    return {
      callMode,
      limit,
      offset,
      includeEnabled,
      include,
    };
  };

  const buildLocalPayload = (local, metadataFilter, documentFilter) => {
    const payload =
      local.callMode === "query"
        ? {
            query_texts: ["example query"],
            n_results: local.limit,
          }
        : {
            limit: local.limit,
            ...(local.offset > 0 ? { offset: local.offset } : {}),
          };

    if (metadataFilter) {
      payload.where = metadataFilter;
    }
    if (documentFilter) {
      payload.where_document = documentFilter;
    }
    if (local.includeEnabled && local.include.length) {
      payload.include = local.include;
    }

    return payload;
  };

  const computeFilters = (state) => {
    const metadataRaw = state.metadata.rawMode
      ? parseRawFilterObject(state.metadata.rawText)
      : { value: null, error: "" };
    const documentRaw = state.document.rawMode
      ? parseRawFilterObject(state.document.rawText)
      : { value: null, error: "" };

    const metadataClauses = state.metadata.rules.map((rule) => buildMetadataClause(rule));
    const documentClauses = state.document.rules.map((rule) => buildDocumentClause(rule));

    const metadataFilter = state.metadata.rawMode
      ? metadataRaw.value
      : combineClauses(metadataClauses, state.metadata.logic);
    const documentFilter = state.document.rawMode
      ? documentRaw.value
      : combineClauses(documentClauses, state.document.logic);
    const cloudDocumentFilter = mapDocumentFilterToCloudWhere(documentFilter);

    const cloudWhere = combineClauses(
      [metadataFilter, cloudDocumentFilter].filter(Boolean),
      "$and"
    );

    const cloud = normalizeCloudOptions(state.cloud);
    const cloudSearchPayload = buildCloudSearchPayload(cloud, cloudWhere);
    const local = normalizeLocalOptions(state.local);
    const localPayload = buildLocalPayload(local, metadataFilter, documentFilter);
    const cloudBundle = cloud.batchEnabled
      ? {
          searches: Array.from({ length: cloud.batchCount }, () => cloneJson(cloudSearchPayload)),
        }
      : cloudSearchPayload;

    return {
      metadataFilter,
      documentFilter,
      metadataRawError: metadataRaw.error,
      documentRawError: documentRaw.error,
      cloudWhere,
      cloud,
      local,
      cloudBundle,
      localBundle: localPayload,
    };
  };

  const toPythonSelectionToken = (field) => {
    if (field === "#document") return "K.DOCUMENT";
    if (field === "#score") return "K.SCORE";
    if (field === "#metadata") return "K.METADATA";
    if (field === "#embedding") return "K.EMBEDDING";
    return jsonString(field);
  };

  const buildPythonSnippet = (state, filters) => {
    if (state.env === "cloud") {
      const imports = ["CloudClient", "Search", "Knn"];
      if (filters.cloud.rankMode === "hybrid_rrf") {
        imports.push("Rrf");
      }
      if (
        (filters.cloud.selectionEnabled && filters.cloud.selectedFields.length) ||
        filters.cloud.groupEnabled
      ) {
        imports.push("K");
      }
      if (filters.cloud.groupEnabled) {
        imports.push("GroupBy");
      }

      const searchLines = ["search = Search()"];
      if (filters.cloudWhere) {
        searchLines.push("search = search.where(filter_payload)");
      }

      if (filters.cloud.rankMode === "knn") {
        searchLines.push(
          `search = search.rank(Knn(query=${jsonString(filters.cloud.denseQuery)}, limit=${filters.cloud.denseLimit}))`
        );
      } else if (filters.cloud.rankMode === "hybrid_rrf") {
        searchLines.push(
          `search = search.rank(Rrf(ranks=[Knn(query=${jsonString(filters.cloud.denseQuery)}, limit=${filters.cloud.denseLimit}, return_rank=True), Knn(query=${jsonString(filters.cloud.sparseQuery)}, key=${jsonString(filters.cloud.sparseKey)}, limit=${filters.cloud.denseLimit}, return_rank=True)], weights=${toPythonLiteral(filters.cloud.rrfWeights)}, k=${filters.cloud.rrfK}))`
        );
      }

      if (filters.cloud.paginationEnabled) {
        const limitArgs =
          filters.cloud.pageOffset > 0
            ? `${filters.cloud.pageLimit}, offset=${filters.cloud.pageOffset}`
            : `${filters.cloud.pageLimit}`;
        searchLines.push(`search = search.limit(${limitArgs})`);
      }

      if (filters.cloud.selectionEnabled && filters.cloud.selectedFields.length) {
        const selectTokens = filters.cloud.selectedFields.map((field) =>
          toPythonSelectionToken(field)
        );
        searchLines.push(`search = search.select(${selectTokens.join(", ")})`);
      }

      if (filters.cloud.groupEnabled) {
        const groupTokens = filters.cloud.groupKeys.map((key) => `K(${jsonString(key)})`);
        const groupExpr =
          groupTokens.length === 1 ? groupTokens[0] : `[${groupTokens.join(", ")}]`;
        searchLines.push(
          `search = search.group_by(GroupBy(keys=${groupExpr}, min_k=${filters.cloud.groupMinK}, max_k=${filters.cloud.groupMaxK}))`
        );
      }

      const resultLines = filters.cloud.batchEnabled
        ? [
            `searches = [${Array.from({ length: filters.cloud.batchCount }, () => "search").join(", ")}]`,
            "results = collection.search(searches)",
            "print(results)",
          ]
        : ["results = collection.search(search)", "print(results.ids)"];

      return [
        `from chromadb import ${Array.from(new Set(imports)).join(", ")}`,
        "",
        "client = CloudClient(",
        '    api_key="ck-your-api-key",',
        '    tenant="your-tenant-id",',
        '    database="your-database-name",',
        ")",
        'collection = client.get_collection("my_collection")',
        "",
        ...(filters.cloudWhere ? [`filter_payload = ${toPythonLiteral(filters.cloudWhere)}`, ""] : []),
        ...searchLines,
        "",
        ...resultLines,
      ].join("\n");
    }

    const localPayload = filters.localBundle;
    const localArgs = [];

    if (filters.local.callMode === "query") {
      localArgs.push(
        `    query_texts=${toPythonLiteral(localPayload.query_texts || ["example query"])}`,
        `    n_results=${localPayload.n_results ?? filters.local.limit}`
      );
    } else {
      localArgs.push(`    limit=${localPayload.limit ?? filters.local.limit}`);
      if (localPayload.offset !== undefined) {
        localArgs.push(`    offset=${localPayload.offset}`);
      }
    }

    if (localPayload.where) {
      localArgs.push(`    where=${indentBlock(toPythonLiteral(localPayload.where), 4)}`);
    }
    if (localPayload.where_document) {
      localArgs.push(
        `    where_document=${indentBlock(toPythonLiteral(localPayload.where_document), 4)}`
      );
    }
    if (localPayload.include) {
      localArgs.push(`    include=${indentBlock(toPythonLiteral(localPayload.include), 4)}`);
    }

    return [
      "import chromadb",
      "",
      'client = chromadb.PersistentClient(path="./chroma-data")',
      'collection = client.get_collection("my_collection")',
      "",
      `results = collection.${filters.local.callMode}(`,
      `${localArgs.join(",\n")}`,
      ")",
      "",
      "print(results['ids'])",
    ].join("\n");
  };

  const buildTypeScriptSnippet = (state, filters) => {
    if (state.env === "cloud") {
      const imports = ["CloudClient", "Search", "Knn"];
      if (filters.cloud.rankMode === "hybrid_rrf") {
        imports.push("Rrf");
      }

      const searchLines = ["let search = new Search();"];
      if (filters.cloudWhere) {
        searchLines.push("search = search.where(filterPayload);");
      }

      if (filters.cloud.rankMode === "knn") {
        searchLines.push(
          `search = search.rank(Knn({ query: ${jsonString(filters.cloud.denseQuery)}, limit: ${filters.cloud.denseLimit} }));`
        );
      } else if (filters.cloud.rankMode === "hybrid_rrf") {
        searchLines.push(
          `search = search.rank(Rrf({ ranks: [Knn({ query: ${jsonString(filters.cloud.denseQuery)}, limit: ${filters.cloud.denseLimit}, return_rank: true }), Knn({ query: ${jsonString(filters.cloud.sparseQuery)}, key: ${jsonString(filters.cloud.sparseKey)}, limit: ${filters.cloud.denseLimit}, return_rank: true })], weights: ${JSON.stringify(filters.cloud.rrfWeights)}, k: ${filters.cloud.rrfK} }));`
        );
      }

      if (filters.cloud.paginationEnabled) {
        searchLines.push(
          `search = search.limit(${filters.cloud.pageLimit}, ${filters.cloud.pageOffset});`
        );
      }

      if (filters.cloud.selectionEnabled && filters.cloud.selectedFields.length) {
        const selectArgs = filters.cloud.selectedFields.map((field) => jsonString(field)).join(", ");
        searchLines.push(`search = search.select(${selectArgs});`);
      }

      if (filters.cloud.groupEnabled) {
        const keys = filters.cloud.groupKeys.map((key) => jsonString(key)).join(", ");
        searchLines.push(
          `search = search.groupBy({ keys: [${keys}], minK: ${filters.cloud.groupMinK}, maxK: ${filters.cloud.groupMaxK} });`
        );
      }

      const resultLines = filters.cloud.batchEnabled
        ? [
            `const searches = Array.from({ length: ${filters.cloud.batchCount} }, () => search);`,
            "const results = await collection.search(searches);",
            "console.log(results);",
          ]
        : ["const results = await collection.search(search);", "console.log(results.rows());"];

      return [
        `import { ${Array.from(new Set(imports)).join(", ")} } from "chromadb";`,
        "",
        "const client = new CloudClient({",
        "  apiKey: process.env.CHROMA_API_KEY,",
        '  tenant: "your-tenant-id",',
        '  database: "your-database-name",',
        "});",
        'const collection = await client.getCollection({ name: "my_collection" });',
        "",
        ...(filters.cloudWhere
          ? [`const filterPayload = ${JSON.stringify(filters.cloudWhere, null, 2)};`, ""]
          : []),
        ...searchLines,
        "",
        ...resultLines,
      ].join("\n");
    }

    const localPayload = filters.localBundle;
    const args = [];

    if (filters.local.callMode === "query") {
      args.push(
        `  queryTexts: ${JSON.stringify(localPayload.query_texts || ["example query"])}`,
        `  nResults: ${localPayload.n_results ?? filters.local.limit}`
      );
    } else {
      args.push(`  limit: ${localPayload.limit ?? filters.local.limit}`);
      if (localPayload.offset !== undefined) {
        args.push(`  offset: ${localPayload.offset}`);
      }
    }

    if (localPayload.where) {
      args.push(`  where: ${indentBlock(JSON.stringify(localPayload.where, null, 2), 2)}`);
    }
    if (localPayload.where_document) {
      args.push(
        `  whereDocument: ${indentBlock(JSON.stringify(localPayload.where_document, null, 2), 2)}`
      );
    }
    if (localPayload.include) {
      args.push(`  include: ${JSON.stringify(localPayload.include)}`);
    }

    return [
      'import { ChromaClient } from "chromadb";',
      "",
      "const client = new ChromaClient({",
      '  path: "http://localhost:8000",',
      "});",
      'const collection = await client.getCollection({ name: "my_collection" });',
      "",
      `const results = await collection.${filters.local.callMode}({`,
      `${args.join(",\n")}`,
      "});",
      "",
      "console.log(results.ids);",
    ].join("\n");
  };

  const outputTitleFor = (tab) => {
    if (tab === "python") {
      return "Python Preview";
    }
    if (tab === "typescript") {
      return "TypeScript Preview";
    }
    return "Filter Payload";
  };

  const modeNoteFor = (state, filters) => {
    if (state.env === "cloud") {
      const features = [];
      if (filters.documentFilter) {
        features.push("document clauses are mapped to '#document'");
      }
      if (filters.cloud.rankMode === "knn") {
        features.push("vector KNN ranking");
      }
      if (filters.cloud.rankMode === "hybrid_rrf") {
        features.push("hybrid RRF ranking");
      }
      if (filters.cloud.paginationEnabled) {
        features.push("pagination");
      }
      if (filters.cloud.selectionEnabled && filters.cloud.selectedFields.length) {
        features.push("field selection");
      }
      if (filters.cloud.groupEnabled) {
        features.push("grouping");
      }
      if (filters.cloud.batchEnabled) {
        features.push(`batch (${filters.cloud.batchCount} searches)`);
      }

      if (features.length) {
        return `Cloud mode uses Search API with ${features.join(", ")}.`;
      }
      return "Cloud mode uses Search API via collection.search(new Search().where(...)).";
    }

    const localFeatures = [];
    if (filters.metadataFilter) {
      localFeatures.push("where");
    }
    if (filters.documentFilter) {
      localFeatures.push("where_document");
    }
    if (filters.local.includeEnabled && filters.local.include.length) {
      localFeatures.push(`include (${filters.local.include.join(", ")})`);
    }
    if (filters.local.callMode === "get" && filters.local.offset > 0) {
      localFeatures.push(`offset ${filters.local.offset}`);
    }

    const method = filters.local.callMode === "get" ? "get()" : "query()";
    const limitText =
      filters.local.callMode === "get"
        ? `limit ${filters.local.limit}`
        : `n_results ${filters.local.limit}`;
    return localFeatures.length
      ? `Local mode uses ${method} with ${limitText}, ${localFeatures.join(", ")}.`
      : `Local mode uses ${method} with ${limitText}.`;
  };

  const initFilterBuilder = (root) => {
    const scope =
      root && typeof root.querySelectorAll === "function" ? root : document;
    const builders = scope.querySelectorAll("[data-filter-builder]");

    builders.forEach((builder) => {
      if (!(builder instanceof HTMLElement)) {
        return;
      }
      if (builder.dataset.initialized === "true") {
        return;
      }
      builder.dataset.initialized = "true";

      const tabButtons = builder.querySelectorAll("[data-env-tab]");
      const outputTabButtons = builder.querySelectorAll("[data-output-tab]");

      const metadataLogicSelect = builder.querySelector('[data-input="metadata-logic"]');
      const documentLogicSelect = builder.querySelector('[data-input="document-logic"]');

      const addMetadataRuleButton = builder.querySelector('[data-action="add-metadata-rule"]');
      const addDocumentRuleButton = builder.querySelector('[data-action="add-document-rule"]');
      const toggleMetadataRawButton = builder.querySelector(
        '[data-action="toggle-metadata-raw"]'
      );
      const toggleDocumentRawButton = builder.querySelector(
        '[data-action="toggle-document-raw"]'
      );
      const resetButton = builder.querySelector('[data-action="reset"]');
      const copyButton = builder.querySelector('[data-action="copy-output"]');

      const metadataRulesContainer = builder.querySelector('[data-role="metadata-rules"]');
      const documentRulesContainer = builder.querySelector('[data-role="document-rules"]');

      const modeNote = builder.querySelector('[data-output="mode-note"]');
      const outputTitle = builder.querySelector('[data-output="title"]');
      const outputCode = builder.querySelector('[data-output="active"]');
      const cloudAdvancedWrapper = builder.querySelector(
        '[data-role="cloud-advanced-wrapper"]'
      );
      const cloudAdvancedPanel = builder.querySelector('[data-role="cloud-advanced"]');
      const toggleCloudAdvancedButton = builder.querySelector(
        '[data-action="toggle-cloud-advanced"]'
      );

      const cloudRankModeSelect = builder.querySelector('[data-input="cloud-rank-mode"]');
      const cloudDenseQueryInput = builder.querySelector('[data-input="cloud-dense-query"]');
      const cloudDenseLimitInput = builder.querySelector('[data-input="cloud-dense-limit"]');
      const cloudSparseQueryInput = builder.querySelector('[data-input="cloud-sparse-query"]');
      const cloudSparseKeyInput = builder.querySelector('[data-input="cloud-sparse-key"]');
      const cloudRrfKInput = builder.querySelector('[data-input="cloud-rrf-k"]');
      const cloudRrfWeightsInput = builder.querySelector('[data-input="cloud-rrf-weights"]');

      const cloudPaginationEnabledInput = builder.querySelector(
        '[data-input="cloud-pagination-enabled"]'
      );
      const cloudPageLimitInput = builder.querySelector('[data-input="cloud-page-limit"]');
      const cloudPageOffsetInput = builder.querySelector('[data-input="cloud-page-offset"]');

      const cloudSelectionEnabledInput = builder.querySelector(
        '[data-input="cloud-selection-enabled"]'
      );
      const cloudSelectDocumentInput = builder.querySelector(
        '[data-input="cloud-select-document"]'
      );
      const cloudSelectScoreInput = builder.querySelector('[data-input="cloud-select-score"]');
      const cloudSelectMetadataInput = builder.querySelector(
        '[data-input="cloud-select-metadata"]'
      );
      const cloudSelectEmbeddingInput = builder.querySelector(
        '[data-input="cloud-select-embedding"]'
      );
      const cloudSelectFieldsInput = builder.querySelector('[data-input="cloud-select-fields"]');

      const cloudGroupEnabledInput = builder.querySelector('[data-input="cloud-group-enabled"]');
      const cloudGroupKeysInput = builder.querySelector('[data-input="cloud-group-keys"]');
      const cloudGroupMinKInput = builder.querySelector('[data-input="cloud-group-min-k"]');
      const cloudGroupMaxKInput = builder.querySelector('[data-input="cloud-group-max-k"]');

      const cloudBatchEnabledInput = builder.querySelector('[data-input="cloud-batch-enabled"]');
      const cloudBatchCountInput = builder.querySelector('[data-input="cloud-batch-count"]');

      const localAdvancedWrapper = builder.querySelector(
        '[data-role="local-advanced-wrapper"]'
      );
      const localAdvancedPanel = builder.querySelector('[data-role="local-advanced"]');
      const toggleLocalAdvancedButton = builder.querySelector(
        '[data-action="toggle-local-advanced"]'
      );
      const localCallModeSelect = builder.querySelector('[data-input="local-call-mode"]');
      const localLimitInput = builder.querySelector('[data-input="local-limit"]');
      const localOffsetInput = builder.querySelector('[data-input="local-offset"]');
      const localIncludeEnabledInput = builder.querySelector(
        '[data-input="local-include-enabled"]'
      );
      const localIncludeDocumentsInput = builder.querySelector(
        '[data-input="local-include-documents"]'
      );
      const localIncludeMetadatasInput = builder.querySelector(
        '[data-input="local-include-metadatas"]'
      );
      const localIncludeDistancesInput = builder.querySelector(
        '[data-input="local-include-distances"]'
      );
      const localIncludeEmbeddingsInput = builder.querySelector(
        '[data-input="local-include-embeddings"]'
      );

      if (
        !(metadataLogicSelect instanceof HTMLSelectElement) ||
        !(documentLogicSelect instanceof HTMLSelectElement) ||
        !(addMetadataRuleButton instanceof HTMLButtonElement) ||
        !(addDocumentRuleButton instanceof HTMLButtonElement) ||
        !(resetButton instanceof HTMLButtonElement) ||
        !(copyButton instanceof HTMLButtonElement) ||
        !(metadataRulesContainer instanceof HTMLElement) ||
        !(documentRulesContainer instanceof HTMLElement) ||
        !(modeNote instanceof HTMLElement) ||
        !(outputTitle instanceof HTMLElement) ||
        !(outputCode instanceof HTMLElement)
      ) {
        return;
      }

      const state = {
        env: "cloud",
        outputTab: "json",
        metadata: {
          logic: "$and",
          rules: [createDefaultMetadataRule()],
          rawMode: false,
          rawText: "",
        },
        document: {
          logic: "$and",
          rules: [],
          rawMode: false,
          rawText: "",
        },
        cloud: createDefaultCloudOptions(),
        local: createDefaultLocalOptions(),
      };

      const setOutputTab = (tab) => {
        if (!OUTPUT_TABS.includes(tab)) {
          return;
        }
        state.outputTab = tab;
        outputTabButtons.forEach((button) => {
          if (!(button instanceof HTMLButtonElement)) {
            return;
          }
          const active = button.dataset.outputTab === tab;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-selected", active ? "true" : "false");
        });
      };

      const hasCloudAdvancedControls =
        cloudAdvancedWrapper instanceof HTMLElement &&
        cloudAdvancedPanel instanceof HTMLElement &&
        toggleCloudAdvancedButton instanceof HTMLButtonElement &&
        cloudRankModeSelect instanceof HTMLSelectElement &&
        cloudDenseQueryInput instanceof HTMLInputElement &&
        cloudDenseLimitInput instanceof HTMLInputElement &&
        cloudSparseQueryInput instanceof HTMLInputElement &&
        cloudSparseKeyInput instanceof HTMLInputElement &&
        cloudRrfKInput instanceof HTMLInputElement &&
        cloudRrfWeightsInput instanceof HTMLInputElement &&
        cloudPaginationEnabledInput instanceof HTMLInputElement &&
        cloudPageLimitInput instanceof HTMLInputElement &&
        cloudPageOffsetInput instanceof HTMLInputElement &&
        cloudSelectionEnabledInput instanceof HTMLInputElement &&
        cloudSelectDocumentInput instanceof HTMLInputElement &&
        cloudSelectScoreInput instanceof HTMLInputElement &&
        cloudSelectMetadataInput instanceof HTMLInputElement &&
        cloudSelectEmbeddingInput instanceof HTMLInputElement &&
        cloudSelectFieldsInput instanceof HTMLInputElement &&
        cloudGroupEnabledInput instanceof HTMLInputElement &&
        cloudGroupKeysInput instanceof HTMLInputElement &&
        cloudGroupMinKInput instanceof HTMLInputElement &&
        cloudGroupMaxKInput instanceof HTMLInputElement &&
        cloudBatchEnabledInput instanceof HTMLInputElement &&
        cloudBatchCountInput instanceof HTMLInputElement;

      const hasLocalAdvancedControls =
        localAdvancedWrapper instanceof HTMLElement &&
        localAdvancedPanel instanceof HTMLElement &&
        toggleLocalAdvancedButton instanceof HTMLButtonElement &&
        localCallModeSelect instanceof HTMLSelectElement &&
        localLimitInput instanceof HTMLInputElement &&
        localOffsetInput instanceof HTMLInputElement &&
        localIncludeEnabledInput instanceof HTMLInputElement &&
        localIncludeDocumentsInput instanceof HTMLInputElement &&
        localIncludeMetadatasInput instanceof HTMLInputElement &&
        localIncludeDistancesInput instanceof HTMLInputElement &&
        localIncludeEmbeddingsInput instanceof HTMLInputElement;

      const renderCloudAdvanced = () => {
        if (!hasCloudAdvancedControls) {
          return;
        }

        cloudAdvancedWrapper.hidden = state.env !== "cloud";
        cloudAdvancedPanel.hidden = !state.cloud.expanded;
        toggleCloudAdvancedButton.setAttribute(
          "aria-expanded",
          state.cloud.expanded ? "true" : "false"
        );
        toggleCloudAdvancedButton.textContent = state.cloud.expanded
          ? "Hide advanced"
          : "Expand";

        cloudRankModeSelect.value = state.cloud.rankMode;
        cloudDenseQueryInput.value = state.cloud.denseQuery;
        cloudDenseLimitInput.value = String(state.cloud.denseLimit);
        cloudSparseQueryInput.value = state.cloud.sparseQuery;
        cloudSparseKeyInput.value = state.cloud.sparseKey;
        cloudRrfKInput.value = String(state.cloud.rrfK);
        cloudRrfWeightsInput.value = state.cloud.rrfWeights;

        cloudPaginationEnabledInput.checked = state.cloud.paginationEnabled;
        cloudPageLimitInput.value = String(state.cloud.pageLimit);
        cloudPageOffsetInput.value = String(state.cloud.pageOffset);

        cloudSelectionEnabledInput.checked = state.cloud.selectionEnabled;
        cloudSelectDocumentInput.checked = state.cloud.selectDocument;
        cloudSelectScoreInput.checked = state.cloud.selectScore;
        cloudSelectMetadataInput.checked = state.cloud.selectMetadata;
        cloudSelectEmbeddingInput.checked = state.cloud.selectEmbedding;
        cloudSelectFieldsInput.value = state.cloud.selectFields;

        cloudGroupEnabledInput.checked = state.cloud.groupEnabled;
        cloudGroupKeysInput.value = state.cloud.groupKeys;
        cloudGroupMinKInput.value = String(state.cloud.groupMinK);
        cloudGroupMaxKInput.value = String(state.cloud.groupMaxK);

        cloudBatchEnabledInput.checked = state.cloud.batchEnabled;
        cloudBatchCountInput.value = String(state.cloud.batchCount);

        const rankMode = state.cloud.rankMode;
        const rankDisabled = rankMode === "none";
        const hybridOnly = rankMode !== "hybrid_rrf";
        cloudDenseQueryInput.disabled = rankDisabled;
        cloudDenseLimitInput.disabled = rankDisabled;
        cloudSparseQueryInput.disabled = hybridOnly;
        cloudSparseKeyInput.disabled = hybridOnly;
        cloudRrfKInput.disabled = hybridOnly;
        cloudRrfWeightsInput.disabled = hybridOnly;

        cloudPageLimitInput.disabled = !state.cloud.paginationEnabled;
        cloudPageOffsetInput.disabled = !state.cloud.paginationEnabled;

        const selectionDisabled = !state.cloud.selectionEnabled;
        cloudSelectDocumentInput.disabled = selectionDisabled;
        cloudSelectScoreInput.disabled = selectionDisabled;
        cloudSelectMetadataInput.disabled = selectionDisabled;
        cloudSelectEmbeddingInput.disabled = selectionDisabled;
        cloudSelectFieldsInput.disabled = selectionDisabled;

        const groupDisabled = !state.cloud.groupEnabled;
        cloudGroupKeysInput.disabled = groupDisabled;
        cloudGroupMinKInput.disabled = groupDisabled;
        cloudGroupMaxKInput.disabled = groupDisabled;

        cloudBatchCountInput.disabled = !state.cloud.batchEnabled;
      };

      const renderLocalAdvanced = () => {
        if (!hasLocalAdvancedControls) {
          return;
        }

        localAdvancedWrapper.hidden = state.env !== "local";
        localAdvancedPanel.hidden = !state.local.expanded;
        toggleLocalAdvancedButton.setAttribute(
          "aria-expanded",
          state.local.expanded ? "true" : "false"
        );
        toggleLocalAdvancedButton.textContent = state.local.expanded
          ? "Hide advanced"
          : "Expand";

        localCallModeSelect.value = state.local.callMode;
        localLimitInput.value = String(state.local.limit);
        localOffsetInput.value = String(state.local.offset);
        localIncludeEnabledInput.checked = state.local.includeEnabled;
        localIncludeDocumentsInput.checked = state.local.includeDocuments;
        localIncludeMetadatasInput.checked = state.local.includeMetadatas;
        localIncludeDistancesInput.checked = state.local.includeDistances;
        localIncludeEmbeddingsInput.checked = state.local.includeEmbeddings;

        localOffsetInput.disabled = state.local.callMode !== "get";
        const includeDisabled = !state.local.includeEnabled;
        localIncludeDocumentsInput.disabled = includeDisabled;
        localIncludeMetadatasInput.disabled = includeDisabled;
        localIncludeDistancesInput.disabled = includeDisabled;
        localIncludeEmbeddingsInput.disabled = includeDisabled;
      };

      const getOutputText = (filters) => {
        if (state.outputTab === "python") {
          return buildPythonSnippet(state, filters);
        }
        if (state.outputTab === "typescript") {
          return buildTypeScriptSnippet(state, filters);
        }
        return JSON.stringify(state.env === "cloud" ? filters.cloudBundle : filters.localBundle, null, 2);
      };

      const renderOutputs = () => {
        const filters = computeFilters(state);
        const outputText = getOutputText(filters);
        const outputLang = state.outputTab === "json" ? "json" : state.outputTab;

        outputTitle.textContent = outputTitleFor(state.outputTab);
        outputCode.innerHTML = highlightCode(outputText, outputLang);
        outputCode.setAttribute("data-language", outputLang);
        modeNote.textContent = modeNoteFor(state, filters);
      };

      const renderEnvTabs = () => {
        tabButtons.forEach((tab) => {
          if (!(tab instanceof HTMLButtonElement)) {
            return;
          }
          const isActive = tab.dataset.envTab === state.env;
          tab.classList.toggle("is-active", isActive);
          tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        renderCloudAdvanced();
        renderLocalAdvanced();
      };

      const renderMetadataRules = () => {
        metadataRulesContainer.innerHTML = "";
        const metadataRawState = parseRawFilterObject(state.metadata.rawText);
        const metadataInRawMode = Boolean(state.metadata.rawMode);

        metadataLogicSelect.disabled = metadataInRawMode || state.metadata.rules.length <= 1;
        addMetadataRuleButton.disabled = metadataInRawMode;

        if (toggleMetadataRawButton instanceof HTMLButtonElement) {
          toggleMetadataRawButton.classList.toggle("is-active", metadataInRawMode);
          toggleMetadataRawButton.textContent = metadataInRawMode
            ? "Builder mode"
            : "JSON mode";
        }

        if (metadataInRawMode) {
          const editor = document.createElement("textarea");
          editor.className = "filter-builder__raw-input";
          editor.value = state.metadata.rawText;
          editor.placeholder = '{\n  "$and": [\n    { "category": "ml" },\n    { "$or": [{ "year": { "$gte": 2023 } }, { "author": { "$eq": "alice" } }] }\n  ]\n}';
          editor.setAttribute("aria-label", "Metadata where JSON object");
          editor.addEventListener("input", () => {
            state.metadata.rawText = editor.value;
            renderOutputs();
            renderMetadataRules();
          });

          const hint = document.createElement("p");
          hint.className = "filter-builder__raw-hint";
          hint.textContent = "Use any where JSON object, including nested $and/$or groups.";

          metadataRulesContainer.appendChild(editor);
          metadataRulesContainer.appendChild(hint);

          if (metadataRawState.error) {
            const error = document.createElement("p");
            error.className = "filter-builder__raw-error";
            error.textContent = metadataRawState.error;
            metadataRulesContainer.appendChild(error);
          }
          return;
        }

        if (!state.metadata.rules.length) {
          const empty = document.createElement("div");
          empty.className = "filter-builder__empty";
          empty.textContent = "No metadata conditions. Add one to start.";
          metadataRulesContainer.appendChild(empty);
          return;
        }

        state.metadata.rules.forEach((rule, index) => {
          const row = document.createElement("div");
          row.className = "filter-builder__rule is-metadata";

          const fieldInput = document.createElement("input");
          fieldInput.type = "text";
          fieldInput.value = rule.field || "";
          fieldInput.placeholder = "field";
          fieldInput.className = "filter-builder__input";
          fieldInput.setAttribute("aria-label", `Metadata condition ${index + 1} field`);
          fieldInput.addEventListener("input", () => {
            state.metadata.rules[index].field = fieldInput.value;
            renderOutputs();
          });

          const operatorSelect = createSelect(METADATA_OPERATORS, rule.operator || "$eq");
          operatorSelect.className = "filter-builder__input";
          operatorSelect.setAttribute("aria-label", `Metadata condition ${index + 1} operator`);
          operatorSelect.addEventListener("change", () => {
            const selectedOperator = operatorSelect.value;
            state.metadata.rules[index].operator = selectedOperator;

            const arrayOp = isArrayOperator(selectedOperator);
            const currentType = state.metadata.rules[index].valueType || "string";
            const hasArrayType = currentType.endsWith("_array");

            if (arrayOp && !hasArrayType) {
              state.metadata.rules[index].valueType = "string_array";
              renderMetadataRules();
              renderOutputs();
              return;
            }

            if (!arrayOp && hasArrayType) {
              state.metadata.rules[index].valueType = "string";
              renderMetadataRules();
              renderOutputs();
              return;
            }

            renderOutputs();
          });

          const valueInput = document.createElement("input");
          valueInput.type = "text";
          valueInput.value = rule.value || "";
          valueInput.placeholder = "value";
          valueInput.className = "filter-builder__input";
          valueInput.setAttribute("aria-label", `Metadata condition ${index + 1} value`);
          valueInput.addEventListener("input", () => {
            state.metadata.rules[index].value = valueInput.value;
            renderOutputs();
          });

          const valueTypeSelect = createSelect(VALUE_TYPES, rule.valueType || "string");
          valueTypeSelect.className = "filter-builder__input";
          valueTypeSelect.setAttribute("aria-label", `Metadata condition ${index + 1} value type`);
          valueTypeSelect.addEventListener("change", () => {
            state.metadata.rules[index].valueType = valueTypeSelect.value;
            renderOutputs();
          });

          const actions = document.createElement("div");
          actions.className = "filter-builder__rule-actions";

          const addButton = document.createElement("button");
          addButton.type = "button";
          addButton.className = "filter-builder__mini-btn";
          addButton.textContent = "+";
          addButton.title = "Add condition after this row";
          addButton.addEventListener("click", () => {
            state.metadata.rules.splice(index + 1, 0, createDefaultMetadataRule());
            renderMetadataRules();
            renderOutputs();
          });

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "filter-builder__mini-btn";
          removeButton.textContent = "-";
          removeButton.title = "Remove condition";
          removeButton.addEventListener("click", () => {
            state.metadata.rules = state.metadata.rules.filter((_, ruleIndex) => ruleIndex !== index);
            renderMetadataRules();
            renderOutputs();
          });

          actions.appendChild(addButton);
          actions.appendChild(removeButton);

          row.appendChild(fieldInput);
          row.appendChild(operatorSelect);
          row.appendChild(valueInput);
          row.appendChild(valueTypeSelect);
          row.appendChild(actions);

          metadataRulesContainer.appendChild(row);
        });
      };

      const renderDocumentRules = () => {
        documentRulesContainer.innerHTML = "";
        const documentRawState = parseRawFilterObject(state.document.rawText);
        const documentInRawMode = Boolean(state.document.rawMode);

        documentLogicSelect.disabled = documentInRawMode || state.document.rules.length <= 1;
        addDocumentRuleButton.disabled = documentInRawMode;

        if (toggleDocumentRawButton instanceof HTMLButtonElement) {
          toggleDocumentRawButton.classList.toggle("is-active", documentInRawMode);
          toggleDocumentRawButton.textContent = documentInRawMode
            ? "Builder mode"
            : "JSON mode";
        }

        if (documentInRawMode) {
          const editor = document.createElement("textarea");
          editor.className = "filter-builder__raw-input";
          editor.value = state.document.rawText;
          editor.placeholder = '{\n  "$and": [\n    { "$contains": "vector" },\n    { "$or": [{ "$not_contains": "deprecated" }, { "$regex": "search.*pattern" }] }\n  ]\n}';
          editor.setAttribute("aria-label", "Document where_document JSON object");
          editor.addEventListener("input", () => {
            state.document.rawText = editor.value;
            renderOutputs();
            renderDocumentRules();
          });

          const hint = document.createElement("p");
          hint.className = "filter-builder__raw-hint";
          hint.textContent =
            "Use where_document JSON with $contains/$not_contains/$regex/$not_regex and nested logic.";

          documentRulesContainer.appendChild(editor);
          documentRulesContainer.appendChild(hint);

          if (documentRawState.error) {
            const error = document.createElement("p");
            error.className = "filter-builder__raw-error";
            error.textContent = documentRawState.error;
            documentRulesContainer.appendChild(error);
          }
          return;
        }

        if (!state.document.rules.length) {
          const empty = document.createElement("div");
          empty.className = "filter-builder__empty";
          empty.textContent = "No document conditions. Add one if you want where_document filtering.";
          documentRulesContainer.appendChild(empty);
          return;
        }

        state.document.rules.forEach((rule, index) => {
          const row = document.createElement("div");
          row.className = "filter-builder__rule is-document";

          const operatorSelect = createSelect(DOCUMENT_OPERATORS, rule.operator || "$contains");
          operatorSelect.className = "filter-builder__input";
          operatorSelect.setAttribute("aria-label", `Document condition ${index + 1} operator`);
          operatorSelect.addEventListener("change", () => {
            state.document.rules[index].operator = operatorSelect.value;
            renderOutputs();
          });

          const valueInput = document.createElement("input");
          valueInput.type = "text";
          valueInput.value = rule.value || "";
          valueInput.placeholder = "term or regex";
          valueInput.className = "filter-builder__input filter-builder__input--wide";
          valueInput.setAttribute("aria-label", `Document condition ${index + 1} value`);
          valueInput.addEventListener("input", () => {
            state.document.rules[index].value = valueInput.value;
            renderOutputs();
          });

          const actions = document.createElement("div");
          actions.className = "filter-builder__rule-actions";

          const addButton = document.createElement("button");
          addButton.type = "button";
          addButton.className = "filter-builder__mini-btn";
          addButton.textContent = "+";
          addButton.title = "Add condition after this row";
          addButton.addEventListener("click", () => {
            state.document.rules.splice(index + 1, 0, createDefaultDocumentRule());
            renderDocumentRules();
            renderOutputs();
          });

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "filter-builder__mini-btn";
          removeButton.textContent = "-";
          removeButton.title = "Remove condition";
          removeButton.addEventListener("click", () => {
            state.document.rules = state.document.rules.filter((_, ruleIndex) => ruleIndex !== index);
            renderDocumentRules();
            renderOutputs();
          });

          actions.appendChild(addButton);
          actions.appendChild(removeButton);

          row.appendChild(operatorSelect);
          row.appendChild(valueInput);
          row.appendChild(actions);

          documentRulesContainer.appendChild(row);
        });
      };

      tabButtons.forEach((tab) => {
        if (!(tab instanceof HTMLButtonElement)) {
          return;
        }
        tab.addEventListener("click", () => {
          state.env = tab.dataset.envTab === "local" ? "local" : "cloud";
          renderEnvTabs();
          renderOutputs();
        });
      });

      outputTabButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }
        button.addEventListener("click", () => {
          setOutputTab(button.dataset.outputTab || "json");
          renderOutputs();
        });
      });

      metadataLogicSelect.addEventListener("change", () => {
        state.metadata.logic = metadataLogicSelect.value === "$or" ? "$or" : "$and";
        renderOutputs();
      });

      documentLogicSelect.addEventListener("change", () => {
        state.document.logic = documentLogicSelect.value === "$or" ? "$or" : "$and";
        renderOutputs();
      });

      addMetadataRuleButton.addEventListener("click", () => {
        state.metadata.rules.push(createDefaultMetadataRule());
        renderMetadataRules();
        renderOutputs();
      });

      addDocumentRuleButton.addEventListener("click", () => {
        state.document.rules.push(createDefaultDocumentRule());
        renderDocumentRules();
        renderOutputs();
      });

      if (toggleMetadataRawButton instanceof HTMLButtonElement) {
        toggleMetadataRawButton.addEventListener("click", () => {
          if (!state.metadata.rawMode && !String(state.metadata.rawText || "").trim()) {
            const seedFilter = combineClauses(
              state.metadata.rules.map((rule) => buildMetadataClause(rule)),
              state.metadata.logic
            );
            if (seedFilter) {
              state.metadata.rawText = JSON.stringify(seedFilter, null, 2);
            }
          }
          state.metadata.rawMode = !state.metadata.rawMode;
          renderMetadataRules();
          renderOutputs();
        });
      }

      if (toggleDocumentRawButton instanceof HTMLButtonElement) {
        toggleDocumentRawButton.addEventListener("click", () => {
          if (!state.document.rawMode && !String(state.document.rawText || "").trim()) {
            const seedFilter = combineClauses(
              state.document.rules.map((rule) => buildDocumentClause(rule)),
              state.document.logic
            );
            if (seedFilter) {
              state.document.rawText = JSON.stringify(seedFilter, null, 2);
            }
          }
          state.document.rawMode = !state.document.rawMode;
          renderDocumentRules();
          renderOutputs();
        });
      }

      if (hasCloudAdvancedControls) {
        toggleCloudAdvancedButton.addEventListener("click", () => {
          state.cloud.expanded = !state.cloud.expanded;
          renderCloudAdvanced();
        });

        cloudRankModeSelect.addEventListener("change", () => {
          state.cloud.rankMode = CLOUD_RANK_MODES.includes(cloudRankModeSelect.value)
            ? cloudRankModeSelect.value
            : "knn";
          renderCloudAdvanced();
          renderOutputs();
        });

        cloudDenseQueryInput.addEventListener("input", () => {
          state.cloud.denseQuery = cloudDenseQueryInput.value;
          renderOutputs();
        });

        cloudDenseLimitInput.addEventListener("input", () => {
          state.cloud.denseLimit = parseInteger(cloudDenseLimitInput.value, 5, 1);
          renderOutputs();
        });

        cloudSparseQueryInput.addEventListener("input", () => {
          state.cloud.sparseQuery = cloudSparseQueryInput.value;
          renderOutputs();
        });

        cloudSparseKeyInput.addEventListener("input", () => {
          state.cloud.sparseKey = cloudSparseKeyInput.value;
          renderOutputs();
        });

        cloudRrfKInput.addEventListener("input", () => {
          state.cloud.rrfK = parseInteger(cloudRrfKInput.value, 60, 1);
          renderOutputs();
        });

        cloudRrfWeightsInput.addEventListener("input", () => {
          state.cloud.rrfWeights = cloudRrfWeightsInput.value;
          renderOutputs();
        });

        cloudPaginationEnabledInput.addEventListener("change", () => {
          state.cloud.paginationEnabled = cloudPaginationEnabledInput.checked;
          renderCloudAdvanced();
          renderOutputs();
        });

        cloudPageLimitInput.addEventListener("input", () => {
          state.cloud.pageLimit = parseInteger(cloudPageLimitInput.value, 20, 1);
          renderOutputs();
        });

        cloudPageOffsetInput.addEventListener("input", () => {
          state.cloud.pageOffset = parseInteger(cloudPageOffsetInput.value, 0, 0);
          renderOutputs();
        });

        cloudSelectionEnabledInput.addEventListener("change", () => {
          state.cloud.selectionEnabled = cloudSelectionEnabledInput.checked;
          renderCloudAdvanced();
          renderOutputs();
        });

        cloudSelectDocumentInput.addEventListener("change", () => {
          state.cloud.selectDocument = cloudSelectDocumentInput.checked;
          renderOutputs();
        });

        cloudSelectScoreInput.addEventListener("change", () => {
          state.cloud.selectScore = cloudSelectScoreInput.checked;
          renderOutputs();
        });

        cloudSelectMetadataInput.addEventListener("change", () => {
          state.cloud.selectMetadata = cloudSelectMetadataInput.checked;
          renderOutputs();
        });

        cloudSelectEmbeddingInput.addEventListener("change", () => {
          state.cloud.selectEmbedding = cloudSelectEmbeddingInput.checked;
          renderOutputs();
        });

        cloudSelectFieldsInput.addEventListener("input", () => {
          state.cloud.selectFields = cloudSelectFieldsInput.value;
          renderOutputs();
        });

        cloudGroupEnabledInput.addEventListener("change", () => {
          state.cloud.groupEnabled = cloudGroupEnabledInput.checked;
          renderCloudAdvanced();
          renderOutputs();
        });

        cloudGroupKeysInput.addEventListener("input", () => {
          state.cloud.groupKeys = cloudGroupKeysInput.value;
          renderOutputs();
        });

        cloudGroupMinKInput.addEventListener("input", () => {
          state.cloud.groupMinK = parseInteger(cloudGroupMinKInput.value, 1, 1);
          renderOutputs();
        });

        cloudGroupMaxKInput.addEventListener("input", () => {
          state.cloud.groupMaxK = parseInteger(cloudGroupMaxKInput.value, 3, 1);
          renderOutputs();
        });

        cloudBatchEnabledInput.addEventListener("change", () => {
          state.cloud.batchEnabled = cloudBatchEnabledInput.checked;
          renderCloudAdvanced();
          renderOutputs();
        });

        cloudBatchCountInput.addEventListener("input", () => {
          state.cloud.batchCount = parseInteger(cloudBatchCountInput.value, 3, 2);
          renderOutputs();
        });
      }

      if (hasLocalAdvancedControls) {
        toggleLocalAdvancedButton.addEventListener("click", () => {
          state.local.expanded = !state.local.expanded;
          renderLocalAdvanced();
        });

        localCallModeSelect.addEventListener("change", () => {
          state.local.callMode = LOCAL_CALL_MODES.includes(localCallModeSelect.value)
            ? localCallModeSelect.value
            : "query";
          renderLocalAdvanced();
          renderOutputs();
        });

        localLimitInput.addEventListener("input", () => {
          state.local.limit = parseInteger(localLimitInput.value, 5, 1);
          renderOutputs();
        });

        localOffsetInput.addEventListener("input", () => {
          state.local.offset = parseInteger(localOffsetInput.value, 0, 0);
          renderOutputs();
        });

        localIncludeEnabledInput.addEventListener("change", () => {
          state.local.includeEnabled = localIncludeEnabledInput.checked;
          renderLocalAdvanced();
          renderOutputs();
        });

        localIncludeDocumentsInput.addEventListener("change", () => {
          state.local.includeDocuments = localIncludeDocumentsInput.checked;
          renderOutputs();
        });

        localIncludeMetadatasInput.addEventListener("change", () => {
          state.local.includeMetadatas = localIncludeMetadatasInput.checked;
          renderOutputs();
        });

        localIncludeDistancesInput.addEventListener("change", () => {
          state.local.includeDistances = localIncludeDistancesInput.checked;
          renderOutputs();
        });

        localIncludeEmbeddingsInput.addEventListener("change", () => {
          state.local.includeEmbeddings = localIncludeEmbeddingsInput.checked;
          renderOutputs();
        });
      }

      resetButton.addEventListener("click", () => {
        state.env = "cloud";
        state.outputTab = "json";
        state.metadata.logic = "$and";
        state.document.logic = "$and";
        state.metadata.rules = [createDefaultMetadataRule()];
        state.document.rules = [];
        state.metadata.rawMode = false;
        state.metadata.rawText = "";
        state.document.rawMode = false;
        state.document.rawText = "";
        state.cloud = createDefaultCloudOptions();
        state.local = createDefaultLocalOptions();

        metadataLogicSelect.value = "$and";
        documentLogicSelect.value = "$and";

        setOutputTab("json");
        renderEnvTabs();
        renderCloudAdvanced();
        renderLocalAdvanced();
        renderMetadataRules();
        renderDocumentRules();
        renderOutputs();
      });

      copyButton.addEventListener("click", async () => {
        const filters = computeFilters(state);
        const text = getOutputText(filters);

        try {
          await navigator.clipboard.writeText(text);
          copyButton.textContent = "Copied";
        } catch (_error) {
          copyButton.textContent = "Copy failed";
        }

        window.setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1200);
      });

      setOutputTab("json");
      renderEnvTabs();
      renderCloudAdvanced();
      renderLocalAdvanced();
      renderMetadataRules();
      renderDocumentRules();
      renderOutputs();
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initFilterBuilder(document);
  });

  if (typeof document$ !== "undefined" && document$) {
    document$.subscribe((root) => {
      initFilterBuilder(root);
    });
  }
})();
