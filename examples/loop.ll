; ModuleID = 'mod'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [4 x i8] c"i: \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.1 = private unnamed_addr constant [16 x i8] c"Breaking at j: \00", align 1
@.strliteral.2 = private unnamed_addr constant [4 x i8] c"j: \00", align 1
@.strliteral.3 = private unnamed_addr constant [18 x i8] c"Continuing at k: \00", align 1
@.strliteral.4 = private unnamed_addr constant [4 x i8] c"k: \00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

declare i8* @realloc(i8*, i32)

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
  %j = alloca i32, align 4
  store i32 0, i32* %j, align 4
  store i32 0, i32* %j, align 4
  br label %loop3

loop3:                                            ; preds = %loopupdate5, %afterloop
  %j.load = load i32, i32* %j, align 4
  %lttmp7 = icmp slt i32 %j.load, 10
  br i1 %lttmp7, label %loopbody4, label %afterloop6

loopbody4:                                        ; preds = %loop3
  %j.load8 = load i32, i32* %j, align 4
  %eqtmp = icmp eq i32 %j.load8, 5
  br i1 %eqtmp, label %then, label %else

loopupdate5:                                      ; preds = %merge
  %j.load17 = load i32, i32* %j, align 4
  %addtmp18 = add i32 %j.load17, 1
  store i32 %addtmp18, i32* %j, align 4
  br label %loop3

afterloop6:                                       ; preds = %then, %loop3
  %k = alloca i32, align 4
  store i32 0, i32* %k, align 4
  store i32 0, i32* %k, align 4
  br label %loop19

then:                                             ; preds = %loopbody4
  %j.load9 = load i32, i32* %j, align 4
  %calltmp010 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([16 x i8], [16 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp111 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %j.load9)
  %newline12 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %afterloop6

else:                                             ; preds = %loopbody4
  br label %merge

merge:                                            ; preds = %else, %after.break
  %j.load13 = load i32, i32* %j, align 4
  %calltmp014 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.strliteral.2, i32 0, i32 0))
  %calltmp115 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %j.load13)
  %newline16 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate5

after.break:                                      ; No predecessors!
  br label %merge

loop19:                                           ; preds = %loopupdate21, %afterloop6
  %k.load = load i32, i32* %k, align 4
  %lttmp23 = icmp slt i32 %k.load, 10
  br i1 %lttmp23, label %loopbody20, label %afterloop22

loopbody20:                                       ; preds = %loop19
  %k.load24 = load i32, i32* %k, align 4
  %eqtmp25 = icmp eq i32 %k.load24, 5
  br i1 %eqtmp25, label %then26, label %else27

loopupdate21:                                     ; preds = %merge28, %then26
  %k.load37 = load i32, i32* %k, align 4
  %addtmp38 = add i32 %k.load37, 1
  store i32 %addtmp38, i32* %k, align 4
  br label %loop19

afterloop22:                                      ; preds = %loop19
  ret void

then26:                                           ; preds = %loopbody20
  %k.load29 = load i32, i32* %k, align 4
  %calltmp030 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([18 x i8], [18 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp131 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %k.load29)
  %newline32 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate21

else27:                                           ; preds = %loopbody20
  br label %merge28

merge28:                                          ; preds = %else27, %after.continue
  %k.load33 = load i32, i32* %k, align 4
  %calltmp034 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.strliteral.4, i32 0, i32 0))
  %calltmp135 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %k.load33)
  %newline36 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate21

after.continue:                                   ; No predecessors!
  br label %merge28
}
