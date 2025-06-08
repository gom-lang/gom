; ModuleID = 'examples/list.ll'
source_filename = "mod"

@.strliteral = private unnamed_addr constant [12 x i8] c"statusList[\00", align 1
@.strliteral.1 = private unnamed_addr constant [13 x i8] c"] = { code: \00", align 1
@.strliteral.2 = private unnamed_addr constant [12 x i8] c", success: \00", align 1
@.strliteral.3 = private unnamed_addr constant [3 x i8] c" }\00", align 1
@fmt.bool = private unnamed_addr constant [3 x i8] c"%d\00", align 1

; Function Attrs: nofree nounwind
declare noundef i32 @printf(i8* nocapture noundef readonly, ...) local_unnamed_addr #0

; Function Attrs: nofree nounwind
define void @main() local_unnamed_addr #0 {
entry:
  %calltmp0 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral, i64 0, i64 0))
  %calltmp1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 0)
  %calltmp2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.1, i64 0, i64 0))
  %calltmp3 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 undef)
  %calltmp4 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.2, i64 0, i64 0))
  %calltmp5 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i1 undef)
  %calltmp6 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.3, i64 0, i64 0))
  %putchar = tail call i32 @putchar(i32 10)
  %calltmp0.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral, i64 0, i64 0))
  %calltmp1.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 1)
  %calltmp2.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.1, i64 0, i64 0))
  %calltmp3.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 undef)
  %calltmp4.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.2, i64 0, i64 0))
  %calltmp5.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i1 undef)
  %calltmp6.1 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.3, i64 0, i64 0))
  %putchar.1 = tail call i32 @putchar(i32 10)
  %calltmp0.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral, i64 0, i64 0))
  %calltmp1.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 2)
  %calltmp2.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.1, i64 0, i64 0))
  %calltmp3.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i32 undef)
  %calltmp4.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.2, i64 0, i64 0))
  %calltmp5.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i64 0, i64 0), i1 undef)
  %calltmp6.2 = tail call i32 (i8*, ...) @printf(i8* nonnull dereferenceable(1) getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.3, i64 0, i64 0))
  %putchar.2 = tail call i32 @putchar(i32 10)
  ret void
}

; Function Attrs: nofree nounwind
declare noundef i32 @putchar(i32 noundef) local_unnamed_addr #0

attributes #0 = { nofree nounwind }
