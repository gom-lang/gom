; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [4 x i8] c"i: \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1

define void @main() {
entry:
  %i = alloca i32, align 4
  store i32 0, i32* %i, align 4
  store i32 0, i32* %i, align 4
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load = load i32, i32* %i, align 4
  %lttmp = icmp slt i32 %i.load, 10
  br i1 %lttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %i.load1 = load i32, i32* %i, align 4
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load1)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate

loopupdate:                                       ; preds = %loopbody
  %i.load2 = load i32, i32* %i, align 4
  %addtmp = add i32 %i.load2, 1
  store i32 %addtmp, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  ret void
}

declare i32 @printf(i8*, ...)
