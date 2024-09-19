import User, { UserCreationAttributes } from '@/db/models/user.model';
import { TKeyValue } from '@/utils/types';
import bcrypt from "bcrypt";
import { Op } from "sequelize";

export async function getAllUsers(filter = {}): Promise<User[]> {
  try {
    const conditions = {
      where: { ...filter }
    };
    const users = await User.findAll({
      ...conditions,
      attributes: {
        exclude: ['password'],
      },
    });
    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
}

export async function getUser(userId: string): Promise<User> {
  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password'],
      },
    });
    if (!user) {
      throw new Error(`❌ User with id ${userId} not found`);
    }
    return user;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    email = email.toLowerCase();
    const user = await User.findOne({
      where: { email }
    });
    return user;
  } catch (err) {
    console.error("❌ Error getting user by email:", err);
    throw err;
  }
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  try {
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      attributes: {
        exclude: ['password'],
      },
    });
    return users;
  } catch (err) {
    console.error("❌ Error getting users by ids:", err);
    throw err;
  }
}

export async function createUser(input: UserCreationAttributes): Promise<User> {
  try {
    const { firstName, lastName, password, isAdmin } = input;
    let { email } = input;
    email = email.toLowerCase();

    let user = null;
    user = await restoreIfDeletedUser(email, {
      firstName,
      lastName,
      password,
      isAdmin,
    });
    if (!user) {
      user = await User.create({ email, firstName, password, lastName, isAdmin, activated: false });
    }
    console.log('👌 User created successfully');
    return await getUser(user.id);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

export async function activateUser(user: User) {
  try {
    await user.update({
      activated: true
    });
  } catch (error) {
    console.error('❌ Error activating user:', error);
    throw error;
  }
}

export async function deactivateUser(user: User) {
  try {
    await user.update({
      activated: false
    });
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    throw error;
  }
}

export async function updatePassword(user: User, newPassword: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);
    await user.update({
      password
    });
  } catch (error) {
    console.error('❌ Error updating password:', error);
    throw error;
  }
}

export async function updateUser(userId: string, updateData: Partial<User>): Promise<User> {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    let { email, ...data } = updateData;
    email = (email || user.email)?.trim()?.toLowerCase();
    const updatedUser = await user.update({
      email,
      ...data
    });
    console.log('👌 User updated successfully');
    return await getUser(updatedUser.id);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
}

export async function updateUsersByIds(userIds: string[], updateData: Partial<User>): Promise<void> {
  try {
    const conditions = { where: { id: userIds } };
    await User.update(updateData, conditions);
  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  }
}

export async function restoreIfDeletedUser(email: string, otherAttributes?: TKeyValue): Promise<User | null> {
  try {
    email = email.toLowerCase();
    let deletedUser = await User.findOne({ where: { email }, paranoid: false });
    if (deletedUser) {
      // Restore the user by setting deletedAt to null
      await deletedUser.restore();
      // if is not admin, deactivate user
      !otherAttributes?.isAdmin && await deactivateUser(deletedUser);
      // is other attributes need updates, update user
      if (otherAttributes) {
        deletedUser = await deletedUser.update({
          ...otherAttributes
        })
      }
      console.log(`👌 User with email ${email} has been restored.`);
    } else {
      console.log(`❌ User with email ${email} not found or not soft-deleted.`);
    }
    return deletedUser;
  } catch (err) {
    console.error("❌ Error restoring deleted user by email:", err);
    throw err;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await User.destroy({
      where: { id: userId }
    });
    console.log('👌 User deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}

export async function deleteUsers(userIds: string[]): Promise<number> {
  try {
    const ids = await User.destroy({ where: { id: userIds } });
    console.log('👌 Users deleted successfully');
    return ids;
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  }
}
