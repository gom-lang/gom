; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [14 x i8] c"Hello, World!\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

declare i8* @realloc(i8*, i32)

define void @main() {
entry:
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([14 x i8], [14 x i8]* @.strliteral, i32 0, i32 0))
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}
