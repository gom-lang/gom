# The Gom Programming Language

**Gom** is a statically typed, multi-paradigm programming language based on a subset of the ECMAScript (and Rust) syntax but providing type-safety and concise syntax. It can be interpreted or compiled to LLVM IR. It takes inspiration from AssemblyScript and makes it more approachable to learn compiler construction.

Here’s a typical hello world program in Gom:

```gom
import io;

fn main() {
	io.log("Hello, world!");
}
```

The `main` function is the entry point to the program, similar to other statically-typed languages. `log` is the standard library function to print content to the console.

Simple arithmetic and function declaration looks like this:

```gom
import io;

fn add(a: i8, b: i8): i8 {
	return a + b;
}

fn main() {
	io.log("Sum:", add(1, 2)); // Prints "Sum: 3"
}
```

Defining complex data structures is possible via the `struct` notation (like `struct` in C/Rust/Go). `let` is the variable declaration keyword, it infers type from the expression on the right hand side of `=`.

```gom
import io;

type ArrInt = i8[10]; // i8 | i8[10] | struct {} | Temp[10]

type Temperature = struct {
	high: i8,
	low: i8,
	avg: i8
};

fn main() {
	let a = 1; // type inferred as i8
	io.log("a:", a);

	let temperature = Temperature {
		high: 32,
		low: 26,
		avg: 29
	};

	io.log("Average temperature:", temperature.avg);
}
```

Apart from the built-in types, custom types can be created using the `type` keyword.

```gom
type Count = i8;
type Name = str;
```

## Development Status

| Stage | Status |
| --- | --- |
| Base grammar definition | ✅ Done |
| Lexical Analysis | ✅ Done |
| Syntactic Analysis (parsing) | ✅ Done |
| Semantic Analysis & preliminary type system | ✅ Done |
| LLVM IR Code Generation | ⚙️ In progress |
| Complex data structures | ⏳ Not started |

## Trying out Gom

The `src/index.ts` file is the entry point for the Gom compiler. To execute the compiler, clone and set up the repository locally:

```bash
npm install
```

To compile a Gom program, run:

```bash
npm run compile <path-to-gom-file>
# e.g.
npm run compile test_2.gom
```

## Updates

https://github.com/gom-lang/gom/commits/main/