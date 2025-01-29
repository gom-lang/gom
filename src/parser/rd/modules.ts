interface ModuleKey {
  name: string;
  version: string;
}

interface Module {
    key: ModuleKey;
    exports: Map<string, 
}

export class ModuleResolver {
  private modules: Map<ModuleKey, Module> = new Map();
}
